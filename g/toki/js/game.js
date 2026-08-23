'use strict';

(function () {
  const VW = 640;
  const VH = 360;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 12000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.35;
  const GY = 320;
  const MY = 248;
  const HY = 176;
  const WALK = 210;
  const AIR = 0.88;
  const JUMP_V = 500;
  const GRAV = 1450;
  const MAX_FALL = 560;
  const COYOTE = 0.08;
  const BUFFER = 0.12;
  const PW = 15;
  const PH = 26;
  const HP_MAX = 100;
  const HIT_DMG = 34;
  const BANANA_HP = 36;
  const INVULN = 1.4;
  const INVULN_TIDE = 1.05;
  const DIE_T = 0.82;
  const SPIT_CD = 0.22;
  const SPIT_MAX = 3;
  const SWIM = 168;
  const SWIM_GRAV = 240;
  const SWIM_MAX = 160;
  const FLAME_T = 8.8;
  const BEST_KEY = 'playbox-toki-best';
  const MUTE_KEY = 'playbox-toki-mute';
  const AUTO_SPEED_KEY = 'playbox-toki-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_SCALE = [1, 0.52, 0.78, 1, 3.4];
  const OPS = '方向键 / D 走跳 · 空格吐火 · ↑ 水里上浮 · A 自动 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 122, 20];
  const HOT2 = [255, 176, 86];
  const WHT = [246, 241, 234];
  const LEAF = [61, 255, 122];
  const FUR = [200, 120, 56];
  const FUR2 = [160, 88, 40];
  const MUZ = [232, 184, 136];
  const PNK = [255, 106, 154];
  const TEAL = [40, 168, 176];
  const DEEP = [12, 48, 64];

  const SCORE = {
    ape: 120, bird: 180, frog: 200, fish: 160,
    banana: 200, flame: 400, bossHit: 80, boss: 4200, stage: 1800
  };

  const STAGES = [
    {
      name: '密林', boss: '石猿', w: 2280, hp: 12, theme: 'jungle',
      ground: [[0, 480], [560, 240], [900, 300], [1300, 980]],
      plats: [
        [160, MY, 150], [380, MY, 140], [640, MY, 150],
        [1040, MY, 160], [1480, MY, 150], [1900, MY, 150],
        [240, HY, 120], [800, HY, 130], [1400, HY, 130], [1880, HY, 130]
      ],
      waters: [[480, 80, 268]],
      ents: [
        [220, GY, 'ape', 40, 460],
        [360, GY, 'ape', 80, 470],
        [200, MY, 'bird', 160, 360],
        [420, HY, 'bird', 240, 500],
        [680, MY, 'frog', 640, 780],
        [980, GY, 'ape', 910, 1180],
        [1100, GY, 'frog', 910, 1180],
        [1080, MY, 'bird', 1040, 1200],
        [1480, GY, 'ape', 1310, 1750],
        [1640, GY, 'frog', 1310, 1750],
        [1520, MY, 'bird', 1480, 1640],
        [1960, HY, 'bird', 1880, 2100]
      ],
      drops: [[380, MY, 'banana'], [1040, MY, 'flame'], [1880, HY, 'banana']]
    },
    {
      name: '深潭', boss: '沼鳄', w: 2560, hp: 16, theme: 'pool',
      ground: [[0, 320], [500, 140], [860, 130], [1220, 150], [1600, 160], [2000, 560]],
      plats: [
        [80, MY, 140], [360, MY, 130], [640, MY, 140],
        [980, MY, 150], [1360, MY, 150], [1760, MY, 160],
        [180, HY, 110], [720, HY, 120], [1180, HY, 130], [1680, HY, 130]
      ],
      waters: [[280, 1780, 236]],
      ents: [
        [180, GY, 'ape', 20, 300],
        [400, 300, 'fish', 300, 620],
        [560, 280, 'fish', 500, 760],
        [700, MY, 'frog', 640, 780],
        [920, 290, 'fish', 860, 1120],
        [1080, 270, 'fish', 980, 1280],
        [1280, MY, 'frog', 1220, 1370],
        [1400, 300, 'fish', 1220, 1550],
        [1680, 280, 'fish', 1600, 1880],
        [1760, MY, 'bird', 1760, 1920],
        [2100, GY, 'ape', 2010, 2400],
        [720, HY, 'bird', 720, 900]
      ],
      drops: [[360, MY, 'banana'], [1180, HY, 'flame'], [1760, MY, 'banana']]
    },
    {
      name: '岩殿', boss: '炎龙', w: 2840, hp: 22, theme: 'rock',
      ground: [[0, 420], [500, 240], [840, 260], [1200, 280], [1580, 340], [2020, 820]],
      plats: [
        [120, MY, 150], [340, MY, 150], [600, MY, 150],
        [960, MY, 160], [1340, MY, 160], [1760, MY, 170], [2300, MY, 160],
        [200, HY, 120], [700, HY, 140], [1140, HY, 140],
        [1640, HY, 150], [2200, HY, 140]
      ],
      waters: [[840, 80, 272]],
      ents: [
        [180, GY, 'ape', 20, 400],
        [340, GY, 'frog', 20, 400],
        [200, MY, 'bird', 120, 320],
        [620, GY, 'ape', 510, 730],
        [720, MY, 'frog', 600, 750],
        [760, HY, 'bird', 700, 900],
        [1000, GY, 'ape', 850, 1090],
        [1100, GY, 'frog', 850, 1090],
        [1000, MY, 'bird', 960, 1120],
        [1400, GY, 'ape', 1210, 1470],
        [1480, MY, 'frog', 1340, 1500],
        [1680, GY, 'ape', 1590, 1900],
        [1800, GY, 'frog', 1590, 1900],
        [1800, MY, 'bird', 1760, 1960],
        [2280, HY, 'bird', 2200, 2440],
        [2360, GY, 'ape', 2030, 2700]
      ],
      drops: [[340, MY, 'banana'], [1140, HY, 'flame'], [1760, MY, 'banana'], [2200, HY, 'flame']]
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
  function spdMul(tide, stage) {
    return (tide ? 1.3 : 1) * (1 + Math.max(0, stage - 1) * 0.08);
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

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    const h = jumpHeight();
    if (h < 74 || h > 96) throw new Error('jump height ' + h);
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('tide faster');
    if (spdMul(false, 2) <= spdMul(false, 1)) throw new Error('later faster');
    if (BEST_KEY !== 'playbox-toki-best') throw new Error('best key');
    if (AUTO_SPEED_KEY !== 'playbox-toki-auto-speed') throw new Error('auto key');
    if (AUTO_SCALE[3] !== 1 || AUTO_SCALE[4] <= AUTO_SCALE[3]) throw new Error('auto scale');
    if (AUTO_SCALE[1] >= AUTO_SCALE[2] || AUTO_SCALE[2] >= AUTO_SCALE[3]) throw new Error('auto scale order');
    if (SPEED_LABELS[3] !== '快' || SPEED_LABELS[4] !== '极快') throw new Error('speed labels');
    if (HP_MAX !== 100) throw new Error('hp');
    if (HIT_DMG < 30 || HIT_DMG > 45) throw new Error('hit dmg');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    if (!STAGES[0].waters.length || !STAGES[1].waters.length) throw new Error('water');
    if (STAGES[0].name === '奇村' || STAGES[0].name === '椰岸') throw new Error('distinct');
    const air = WALK * AIR * (2 * JUMP_V / GRAV);
    let i, s, hasPit, hasEnt, hasDrop, g, gap, covered, w;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ground.length || !s.ents.length) throw new Error('stage ' + s.name);
      hasPit = false;
      hasEnt = false;
      hasDrop = false;
      s.ents.forEach(function (e) {
        if (e[2] === 'ape' || e[2] === 'bird' || e[2] === 'frog' || e[2] === 'fish') hasEnt = true;
        if (e[2] === 'axe' || e[2] === 'punch') throw new Error('no axe punch');
      });
      s.drops.forEach(function (d) {
        if (d[2] === 'banana' || d[2] === 'flame') hasDrop = true;
        if (d[2] === 'skate' || d[2] === 'bike') throw new Error('no skate bike');
      });
      for (g = 0; g < s.ground.length - 1; g++) {
        gap = s.ground[g + 1][0] - (s.ground[g][0] + s.ground[g][1]);
        if (gap < 48) throw new Error('pit tiny ' + s.name + ' ' + gap);
        covered = false;
        for (w = 0; w < s.waters.length; w++) {
          const wt = s.waters[w];
          const mid = s.ground[g][0] + s.ground[g][1] + gap * 0.5;
          if (mid >= wt[0] && mid <= wt[0] + wt[1]) covered = true;
        }
        if (!covered) {
          hasPit = true;
          if (gap > air - 16) throw new Error('pit wide ' + s.name + ' ' + gap + '>' + air);
        }
      }
      if (!hasEnt) throw new Error('ents ' + s.name);
      if (!hasDrop) throw new Error('drops ' + s.name);
      if (i !== 1 && !hasPit) throw new Error('pits ' + s.name);
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
  const hpWrap = document.getElementById('hp-wrap');
  const hpBar = document.getElementById('hp-bar');
  const flameLabel = document.getElementById('flame-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const chainPop = document.getElementById('chain-pop');
  const hintEl = document.getElementById('hint');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnAuto = document.getElementById('btn-auto');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');
  const modeSave = document.getElementById('mode-save');
  const modeTide = document.getElementById('mode-tide');
  const btnSave = document.getElementById('btn-save');
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
  const mist = [];
  const leaves = [];
  const bubbles = [];
  const keys = { l: false, r: false, u: false, d: false, fire: false };
  const demo = { l: false, r: false, u: false, d: false, fire: false };
  const autoIn = { l: false, r: false, u: false, d: false, fire: false };
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
    kind: 'save',
    stage: 1,
    levelW: 2280,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    maxCombo: 0,
    mult: 1,
    hp: HP_MAX,
    flameT: 0,
    player: null,
    plats: [],
    waters: [],
    ents: [],
    shots: [],
    pickups: [],
    boss: null,
    girl: null,
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
    spitCd: 0,
    spitT: 0,
    muzzle: 0,
    jumpBuf: 0,
    fireBuf: 0,
    dropT: 0,
    checkX: 70,
    checkY: GY,
    clearT: 0,
    lock: 0,
    nextLife: LIFE_EVERY,
    why: '',
    toastT: 0
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
  function inD() {
    if (autoPlaying()) return autoIn.d;
    return G.mode === 'title' ? demo.d : (overlayOpen() ? false : keys.d);
  }
  function fireHeld() {
    if (autoPlaying()) return autoIn.fire;
    return G.mode === 'title' ? demo.fire : (overlayOpen() ? false : keys.fire);
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
    return x > G.camX - pad && x < G.camX + VW + pad;
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
      this.beep(240, 0.07, 'square', 0.042, 540);
    },
    land() {
      this.ensure();
      this.noise(0.04, 0.026, 480);
      this.beep(120, 0.05, 'triangle', 0.022, 64);
    },
    spit(big) {
      this.ensure();
      this.noise(0.07, big ? 0.058 : 0.042, 280);
      this.beep(big ? 280 : 340, 0.1, 'sawtooth', 0.048, 90);
      this.beep(big ? 620 : 780, 0.05, 'square', 0.03, 220);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.035, 0.034, 1100);
      this.beep(520 * lift, 0.06, 'square', 0.044, 900 * lift);
    },
    boom() {
      this.ensure();
      this.noise(0.16, 0.072, 220);
      this.beep(160, 0.18, 'sawtooth', 0.05, 48);
    },
    splash() {
      this.ensure();
      this.noise(0.09, 0.046, 420);
      this.beep(380, 0.08, 'sine', 0.03, 180);
    },
    banana() {
      this.ensure();
      this.beep(523, 0.07, 'square', 0.04, 784);
      this.beep(784, 0.1, 'triangle', 0.038, 1046);
    },
    flame() {
      this.ensure();
      this.noise(0.1, 0.05, 240);
      this.beep(220, 0.14, 'sawtooth', 0.046, 88);
      this.beep(880, 0.1, 'triangle', 0.032, 1320);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    hurt() {
      this.ensure();
      this.noise(0.08, 0.05, 380);
      this.beep(280, 0.12, 'sawtooth', 0.046, 90);
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
    kiss() {
      this.ensure();
      this.beep(660, 0.08, 'sine', 0.04, 880);
      this.beep(990, 0.16, 'triangle', 0.045, 1320);
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
    if (modeSave) modeSave.setAttribute('aria-pressed', t ? 'false' : 'true');
    if (modeTide) modeTide.setAttribute('aria-pressed', t ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      stageLabel.textContent = (isTide() ? '兽潮 ' : '') + spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isTide() ? '兽潮' : '救美';
      tagLabel.classList.toggle('warn', isTide());
    }
    if (hpBar) hpBar.style.transform = 'scaleX(' + clamp(G.hp / HP_MAX, 0, 1) + ')';
    if (hpWrap) {
      hpWrap.classList.toggle('warn', G.hp <= 34 && playing());
      hpWrap.classList.toggle('hot', G.hp >= 90 && playing());
    }
    if (flameLabel) {
      flameLabel.classList.toggle('hidden', G.flameT <= 0);
      flameLabel.textContent = G.flameT > 0 ? '烈火' : '';
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    const p = G.player;
    const wet = p && waterAt(p.x, p.y);
    if (autoOn) {
      if (G.mode === 'title') setHint('自动托管 · 即将开局 · A 停下', 'hot');
      else if (G.mode === 'lose') setHint('自动仍开着 · 即将再开 · A 停下', 'warn');
      else if (G.mode === 'win') setHint('自动仍开着 · 即将再开 · A 停下', 'hot');
      else if (G.boss && G.boss.active && !G.boss.dead) setHint('托管中 · 头目 ' + spec.boss + ' · A 停下', 'hot');
      else setHint(isTide() ? '托管中 · 兽潮吐火 · A 停下' : '托管中 · 走跳吐火救人 · A 停下', 'hot');
    } else if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 吐火开路，水里也能喷', 'warn');
    else if (G.mode === 'win') setHint('救出来了 · R 再来一局', 'hot');
    else if (G.girl && G.girl.free) setHint('过去救人 · 她在笼子那边', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 空格吐火 · 跳过深坑', 'warn');
    else if (G.hp <= 34) setHint('体快空了 · 摘蕉回体', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('头目 · ' + spec.boss + ' · 吐火打它', 'hot');
    else if (wet) setHint('水里 · ↑ 上浮 · 空格吐火', 'hot');
    else setHint('走跳 · 空格吐火 · 水里游 · A 自动', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'RESCUE' : 'TOKI';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '兽潮' : '换模式';
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
    stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'win-flash', 'spit');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'win-flash', 'spit');
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
      w: PW, h: PH,
      grounded: true, coyote: 0,
      squash: 1, run: 0, swim: false, wet: false
    };
  }

  function makePlat(x, y, w, base) {
    return { x: x, y: y, w: w, h: base ? 48 : 12, base: !!base };
  }

  function hpOf(kind) {
    if (kind === 'frog') return 2;
    if (kind === 'bird') return 1;
    if (kind === 'fish') return 1;
    return 1;
  }

  function makeEnt(x, y, kind, a, b) {
    const hp = hpOf(kind);
    const fly = kind === 'bird' || kind === 'fish';
    return {
      id: uid++,
      x: x, y: y, vx: 0, vy: 0, face: -1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b,
      t: rand(0, 2), fire: rand(0.6, 1.4),
      hopT: rand(0.3, 0.9),
      grounded: !fly,
      dead: false, hitN: 0,
      homeY: y, homeX: x,
      w: kind === 'frog' ? 16 : kind === 'bird' ? 16 : kind === 'fish' ? 14 : 14,
      h: kind === 'frog' ? 14 : kind === 'bird' ? 12 : kind === 'fish' ? 10 : 20
    };
  }

  function makeBoss(spec) {
    const hp = (spec.hp * (isTide() ? 1.25 : 1)) | 0;
    const swim = spec.boss === '沼鳄';
    const fly = spec.boss === '炎龙';
    return {
      id: uid++,
      x: spec.w - 180, y: swim ? 280 : (fly ? HY + 24 : GY),
      vx: 0, vy: 0, face: -1,
      hp: hp, max: hp, kind: spec.boss,
      t: 0, fire: 1.1, state: 'wait',
      grounded: !swim && !fly, dead: false, active: false,
      hitN: 0,
      w: swim ? 44 : fly ? 40 : 34,
      h: swim ? 22 : fly ? 28 : 32,
      name: spec.boss,
      homeY: swim ? 280 : (fly ? HY + 24 : GY)
    };
  }

  function seedMist() {
    mist.length = 0;
    leaves.length = 0;
    let i;
    for (i = 0; i < 9; i++) {
      mist.push({
        x: rand(0, 800),
        y: rand(50, 250),
        r: rand(16, 34),
        a: rand(0.02, 0.05),
        vx: rand(7, 16)
      });
    }
    for (i = 0; i < 14; i++) {
      leaves.push({
        x: rand(0, 900),
        y: rand(40, 280),
        vx: rand(18, 42),
        vy: rand(-8, 12),
        rot: rand(0, TAU),
        vr: rand(-2, 2),
        rgb: hash2(i) > 0.5 ? HOT : LEAF
      });
    }
  }

  function loadStage(n, attract) {
    const spec = STAGES[clamp(n, 1, STAGES.length) - 1];
    G.stage = n;
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
    G.waters = [];
    for (i = 0; i < spec.waters.length; i++) {
      const wt = spec.waters[i];
      G.waters.push({ x: wt[0], w: wt[1], surf: wt[2] });
    }
    G.ents = [];
    for (i = 0; i < spec.ents.length; i++) {
      const e = spec.ents[i];
      G.ents.push(makeEnt(e[0], e[1], e[2], e[3], e[4]));
    }
    if (isTide() && !attract) {
      for (i = 0; i < spec.ents.length; i++) {
        if (i % 2 !== 0) continue;
        const e = spec.ents[i];
        if (e[2] === 'bird') continue;
        G.ents.push(makeEnt(e[0] - 26, e[1], e[2], e[3], e[4]));
      }
    }
    G.pickups = [];
    if (!attract) {
      for (i = 0; i < spec.drops.length; i++) {
        const d = spec.drops[i];
        G.pickups.push({ x: d[0] + 40, y: d[1] - 18, kind: d[2], taken: false, t: 0 });
      }
    }
    G.shots = [];
    G.boss = makeBoss(spec);
    G.girl = n === STAGES.length ? { x: spec.w - 88, y: GY, free: false, t: 0, cage: true } : null;
    G.player = makePlayer(70, GY);
    G.camX = 0;
    G.camY = 0;
    G.checkX = 70;
    G.checkY = GY;
    G.deadT = 0;
    G.invuln = attract ? 99 : 0.4;
    G.spitCd = 0;
    G.spitT = 0;
    G.muzzle = 0;
    G.clearT = 0;
    G.lock = 0;
    G.dropT = 0;
    seedMist();
    bubbles.length = 0;
  }

  function waterAt(x, y) {
    let i, w;
    for (i = 0; i < G.waters.length; i++) {
      w = G.waters[i];
      if (x >= w.x && x <= w.x + w.w && y >= w.surf - 6 && y < VH + 90) return w;
    }
    return null;
  }

  function landOn(x, y0, y1) {
    if (G.dropT > 0) return null;
    let i, p, best = null;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (x < p.x - 2 || x > p.x + p.w + 2) continue;
      if (y0 <= p.y + 4 && y1 >= p.y - 2) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }

  function pitAhead(x, y, dir) {
    const nx = x + dir * 30;
    if (waterAt(nx, y + 8)) return false;
    let i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (!p.base) continue;
      if (nx >= p.x && nx <= p.x + p.w && Math.abs(y - p.y) < 18) return false;
    }
    return true;
  }

  function pBox() {
    const p = G.player;
    return { x: p.x - p.w * 0.5, y: p.y - p.h, w: p.w, h: p.h };
  }

  function countOwnShots() {
    let n = 0, i;
    for (i = 0; i < G.shots.length; i++) if (G.shots[i].own === 'p') n += 1;
    return n;
  }

  function trySpit() {
    if (G.spitCd > 0 || G.deadT > 0) return;
    if (countOwnShots() >= (G.flameT > 0 ? 4 : SPIT_MAX)) return;
    const p = G.player;
    if (!p) return;
    G.spitCd = G.flameT > 0 ? 0.16 : SPIT_CD;
    G.spitT = 0.16;
    G.muzzle = 0.1;
    G.fireBuf = 0;
    const wet = !!waterAt(p.x, p.y);
    const big = G.flameT > 0;
    const spd = (big ? 420 : 360) * (wet ? 0.72 : 1);
    const shot = {
      x: p.x + p.face * 16,
      y: p.y - 16,
      vx: p.face * spd,
      vy: wet ? -40 : 30,
      w: big ? 14 : 10,
      h: big ? 12 : 9,
      dmg: big ? 2 : 1,
      life: wet ? 0.9 : 0.72,
      own: 'p',
      rgb: big ? GOLD : HOT,
      g: wet ? -80 : 160,
      big: big,
      rot: 0,
      hit: {}
    };
    G.shots.push(shot);
    if (playing()) {
      audio.spit(big);
      hitStop(0.034);
      kick(1.8, 'spit');
      emit(6, {
        x: shot.x, y: shot.y, j: 4,
        vx0: p.face * 40, vx1: p.face * 160, vy0: -50, vy1: 20,
        life: 0.2, r0: 1, r1: 2.6, rgb: HOT, g: 80
      });
      popSpark(shot.x, shot.y, HOT2, 10);
    }
  }

  function enemyShot(x, y, vx, vy, dmg) {
    G.shots.push({
      x: x, y: y, vx: vx, vy: vy,
      w: 8, h: 8, dmg: dmg || 1, life: 1.4,
      own: 'e', rgb: MAG, g: 40, big: false, rot: 0, hit: {}
    });
  }

  function takePickup(u) {
    u.taken = true;
    if (u.kind === 'banana') {
      G.hp = clamp(G.hp + BANANA_HP, 0, HP_MAX);
      bumpCombo();
      addScore(SCORE.banana * G.mult);
      floatText(u.x, u.y - 10, '+' + BANANA_HP, GOLD, false);
      juice(u.x, u.y, GOLD, 0.7);
      audio.banana();
      toast('蕉 · 回体', false, true);
      G.checkX = u.x;
      G.checkY = G.player ? G.player.y : GY;
    } else {
      G.flameT = FLAME_T;
      bumpCombo();
      addScore(SCORE.flame * G.mult);
      floatText(u.x, u.y - 10, '烈火', HOT, true);
      juice(u.x, u.y, HOT, 1.1);
      audio.flame();
      toast('烈火 · 喷更猛', false, true);
    }
    hitStop(0.04);
    syncHud();
  }

  function killEnt(e) {
    e.dead = true;
    bumpCombo();
    const base = SCORE[e.kind] || 100;
    const n = base * G.mult;
    addScore(n);
    floatText(e.x, e.y - 12, String(n), GOLD, G.mult >= 2);
    juice(e.x, e.y - 8, e.kind === 'fish' ? CYN : HOT, 0.9);
    audio.hit(G.combo);
    hitStop(0.055);
    kick(2.6, 'boom');
  }

  function hurtEnt(e, dmg, x, y) {
    e.hp -= dmg;
    e.hitN = 0.12;
    emit(5, {
      x: x, y: y, j: 5,
      vx0: -80, vx1: 80, vy0: -120, vy1: -10,
      life: 0.22, r0: 1, r1: 2.4, rgb: HOT
    });
    popSpark(x, y, GOLD, 8);
    if (e.hp <= 0) killEnt(e);
    else {
      audio.hit(G.combo);
      hitStop(0.04);
    }
  }

  function hurtBoss(dmg, x, y) {
    const b = G.boss;
    if (!b || b.dead || !b.active) return;
    b.hp -= dmg;
    b.hitN = 0.14;
    addScore(SCORE.bossHit * G.mult);
    juice(x, y, HOT, 1.1);
    audio.hit(G.combo);
    hitStop(0.06);
    kick(3.2, 'boom');
    if (b.hp <= 0) {
      b.dead = true;
      b.hp = 0;
      bumpCombo();
      addScore(SCORE.boss * G.mult);
      floatText(b.x, b.y - 20, String(SCORE.boss * G.mult), GOLD, true);
      juice(b.x, b.y - 10, GOLD, 1.8);
      audio.boom();
      audio.boss();
      screenFlash(GOLD, 0.5);
      hitStop(0.08);
      kick(5.5, 'boom');
      toast(b.name + ' 倒下', false, true);
      if (G.girl) {
        G.girl.free = true;
        G.girl.cage = false;
        toast('笼子开了 · 去救人', false, true);
      } else {
        G.clearT = 1.35;
      }
      syncHud();
    }
  }

  function die(why) {
    if (!playing() || G.deadT > 0) return;
    G.why = why;
    G.lives -= 1;
    G.deadT = DIE_T;
    G.hp = 0;
    G.flameT = 0;
    audio.death();
    juice(G.player.x, G.player.y - 10, MAG, 1.4);
    kick(7, 'die');
    hitStop(0.07);
    screenFlash(MAG, 0.4);
    toast(why === 'fall' ? '掉下去了' : '体空了', true, false);
    syncHud();
  }

  function hurtPlayer(why) {
    if (!playing() || G.invuln > 0 || G.deadT > 0) return;
    G.hp -= HIT_DMG;
    audio.hurt();
    juice(G.player.x, G.player.y - 12, MAG, 0.9);
    hitStop(0.055);
    kick(3.6, 'hit');
    screenFlash(MAG, 0.28);
    if (G.hp <= 0) {
      G.hp = 0;
      die(why);
    } else {
      G.invuln = invulnTime();
      toast('挨打 −' + HIT_DMG, true, false);
    }
    syncHud();
  }

  function respawn() {
    G.player = makePlayer(G.checkX, G.checkY);
    G.hp = HP_MAX;
    G.invuln = INVULN;
    G.deadT = 0;
    G.spitCd = 0.1;
    G.flameT = 0;
    toast('重生', true, false);
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    const why = G.why === 'fall' ? '掉下去了' : '体空了';
    showOverlay('lose', '没救到', why + '。连击 ×' + G.maxCombo + ' · ' + G.score + ' 分');
    syncHud();
  }

  function goWin() {
    const bonus = isTide() ? 12000 : 8000;
    addScore(bonus);
    G.mode = 'win';
    audio.win();
    audio.kiss();
    kick(4, 'win-flash');
    screenFlash(GOLD, 0.42);
    showOverlay('win', isTide() ? '兽潮平了' : '救出来了',
      (isTide() ? '兽潮打穿三关。' : '把人从岩殿救出来了。') + G.score + ' 分 · 连击 ×' + G.maxCombo);
    syncHud();
  }

  function nextStage() {
    addScore(SCORE.stage * G.stage);
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    const keepF = G.flameT;
    loadStage(G.stage + 1, false);
    G.flameT = keepF;
    G.hp = HP_MAX;
    G.invuln = 1.1;
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    syncHud();
  }

  function startGame(kind) {
    G.mode = 'play';
    G.kind = kind === 'tide' ? 'tide' : 'save';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.hp = HP_MAX;
    G.flameT = 0;
    G.nextLife = LIFE_EVERY;
    G.why = '';
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    loadStage(1, false);
    autoStuck = 0;
    autoBackT = 0;
    autoWalkDir = 1;
    autoLastX = 70;
    autoLastY = GY;
    hideOverlay();
    audio.start();
    toast(isTide() ? '兽潮 · 更密' : STAGES[0].name, isTide(), !isTide());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'save';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.mult = 1;
    G.hp = HP_MAX;
    G.flameT = 0;
    loadStage(1, true);
    G.invuln = 99;
    showOverlay('title', '猿人', '被咒成猿，吐火开路。水潭里游，坑要跳过。挨打掉体，体空丢命。尽头把人救出来。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('save');
    else startGame(G.kind || 'save');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('save');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
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

  function nearestPlat(x, floorY, maxD) {
    let i, p, d, best = null, bestD = maxD || 260;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (Math.abs(p.y - floorY) > 10) continue;
      if (x >= p.x && x <= p.x + p.w) return p;
      d = x < p.x ? p.x - x : x - (p.x + p.w);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best;
  }

  function gapAhead(x, y, dir, look) {
    const nx = x + dir * (look || 28);
    if (waterAt(nx, y + 8) || waterAt(nx, GY)) return false;
    let i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (nx >= p.x - 2 && nx <= p.x + p.w + 2 && p.y >= y - 8 && p.y <= y + 22) return false;
    }
    return true;
  }

  function supportAt(x, y) {
    let i, p, best = null;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (x < p.x - 2 || x > p.x + p.w + 2) continue;
      if (p.y < y - 6) continue;
      if (!best || p.y < best.y) best = p;
    }
    if (waterAt(x, y + 12) || waterAt(x, GY)) return { x: x, y: GY, w: 40, water: true };
    return best;
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

  function autoShotThreat() {
    const p = G.player;
    let i, s, t;
    for (i = 0; i < G.shots.length; i++) {
      s = G.shots[i];
      if (s.own !== 'e') continue;
      if (Math.abs(s.y - (p.y - 14)) > 28) continue;
      if (s.vx === 0) {
        if (Math.abs(s.x - p.x) < 42) return s;
        continue;
      }
      t = (p.x - s.x) / s.vx;
      if (t < 0 || t > 0.5) continue;
      if (Math.abs((s.x + s.vx * t) - p.x) < 22) return s;
    }
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

    let i, u, dx, d, pri;
    if (G.girl && G.girl.free) consider(G.girl.x, G.girl.y, 1400, 'girl');
    for (i = 0; i < G.pickups.length; i++) {
      u = G.pickups[i];
      if (u.taken) continue;
      dx = u.x - p.x;
      d = hypot(dx, u.y - (p.y - 12));
      if (u.kind === 'banana') pri = G.hp <= 36 ? 920 : G.hp <= 66 ? 420 : 120;
      else pri = G.flameT < 1 ? 540 : 80;
      if (dx < -40) pri -= 420;
      if (dx > 0 && dx < 280) pri += 70;
      pri -= d * 0.3;
      consider(u.x, u.y + 16, pri, 'loot');
    }
    if (G.boss && G.boss.active && !G.boss.dead) {
      const side = p.x < G.boss.x ? -1 : 1;
      consider(G.boss.x + side * 110, G.boss.y, 1200, 'boss');
    }
    if (!(G.girl && G.girl.free)) {
      consider(G.levelW - 48, GY, G.boss && G.boss.active && !G.boss.dead ? 180 : 880, 'exit');
    }
    if (!best) consider(Math.min(G.levelW - 40, p.x + 220), GY, 50, 'go');
    return best;
  }

  function autoThink() {
    clearAutoKeys();
    if (!autoOn || G.mode !== 'play') return;
    const p = G.player;
    if (!p || G.deadT > 0 || G.lock > 0) return;

    const moved = hypot(p.x - autoLastX, p.y - autoLastY);
    if (moved < 2.4 && (p.grounded || p.swim)) autoStuck += STEP;
    else if (moved > 10) autoStuck = 0;
    autoLastX = p.x;
    autoLastY = p.y;
    if (autoBackT > 0) autoBackT -= STEP;

    const floorY = snapFloor(p.y);
    const goal = autoPick();
    const tfloor = snapFloor(goal.y);
    let seekX = goal.x;
    let wantJump = false;
    let wantDn = false;
    let wantFire = false;
    const wet = waterAt(p.x, p.y);
    const b = G.boss;

    if (autoBackT > 0) seekX = p.x - autoWalkDir * 64;
    else if (tfloor < floorY - 10 && !wet) {
      const above = nearestPlat(p.x + 20, tfloor < HY + 8 ? HY : MY, 200) || nearestPlat(p.x, MY, 180);
      if (above) {
        seekX = clamp(p.x < above.x ? above.x + 18 : p.x, above.x + 10, above.x + above.w - 10);
        if (p.x >= above.x - 8 && p.x <= above.x + above.w + 8) wantJump = true;
      }
    } else if (tfloor > floorY + 10 && !wet) {
      const here = platCovering(p.x, floorY);
      if (here && !here.base) wantDn = true;
    }

    autoSteer(seekX);

    let i, e, dx, hop = false;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead || !onScreen(e.x, 24)) continue;
      dx = e.x - p.x;
      if (dx > -30 && dx < 230 && Math.abs(e.y - p.y) < 92) {
        wantFire = true;
        if (dx > 4 && dx < 38 && (e.kind === 'ape' || e.kind === 'frog')) hop = true;
      }
    }
    if (b && b.active && !b.dead) {
      wantFire = true;
      dx = b.x - p.x;
      if (Math.abs(dx) < 96) {
        autoIn.l = false;
        autoIn.r = false;
        autoWalkDir = dx >= 0 ? 1 : -1;
      } else autoSteer(b.x);
      if (b.kind === '炎龙' && p.grounded) wantJump = true;
    }

    if (autoShotThreat() && G.invuln <= 0 && p.grounded) wantJump = true;
    if (hop && p.grounded) wantJump = true;

    const dir = autoIn.r ? 1 : autoIn.l ? -1 : 1;
    if (wet) {
      autoSteer(seekX);
      const aheadLand = !waterAt(p.x + 40, p.y) && supportAt(p.x + 40, GY);
      if (aheadLand || p.y > wet.surf + 20) autoIn.u = true;
    } else if (p.grounded && (gapAhead(p.x, p.y, dir, 32) || pitAhead(p.x, p.y, dir))) {
      wantJump = true;
    }

    if (autoStuck > 0.7 && !(b && b.active && !b.dead)) wantJump = true;
    if (autoStuck > 2.1 && !(b && b.active && !b.dead)) {
      autoBackT = 0.28;
      autoStuck = 0;
    }

    if (wantDn && !wantJump && !wet) autoIn.d = true;
    if (wantJump) autoIn.u = true;
    if (wantFire || (b && b.active && !b.dead)) autoIn.fire = true;
    const holdBoss = b && b.active && !b.dead && Math.abs(b.x - p.x) < 140;
    if (!autoIn.l && !autoIn.r && !holdBoss) autoIn.r = true;
  }

  function tickAutoFlow(dt) {
    if (!autoOn) return;
    if (G.mode === 'title') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.25 : 0.5)) {
        autoOvWait = 0;
        startGame(G.kind || 'save');
      }
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.7 : 1.15)) {
        autoOvWait = 0;
        startGame(G.kind || 'save');
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
    keys.d = false;
    keys.fire = false;
    syncAutoUi();
    if (autoOn) {
      audio.ensure();
      if (G.mode === 'title') startGame(G.kind || 'save');
    }
    syncHud();
  }

  function isAutoKey(e) {
    return e.code === 'KeyA' || e.key === 'a' || e.key === 'A';
  }

  function demoThink() {
    const p = G.player;
    demo.r = true;
    demo.l = false;
    demo.d = false;
    demo.fire = ((G.clock * 2.2) | 0) % 2 === 0;
    const wet = waterAt(p.x, p.y);
    demo.u = wet ? (p.y > (wet.surf + 28)) : (pitAhead(p.x, p.y, 1) && p.grounded);
    if (p.x > G.levelW - 280) {
      G.player = makePlayer(70, GY);
      G.camX = 0;
    }
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

    const wet = waterAt(p.x, p.y);
    const wasSwim = p.swim;
    p.swim = !!wet;
    if (wet && !wasSwim && playing()) {
      audio.splash();
      emit(8, {
        x: p.x, y: wet.surf, j: 10,
        vx0: -70, vx1: 70, vy0: -90, vy1: -10,
        life: 0.28, r0: 1.2, r1: 3, rgb: CYN, g: 220
      });
      hitStop(0.02);
    }
    if (!wet && wasSwim && p.vy < 0) {
      p.vy = Math.min(p.vy, -260);
      emit(6, {
        x: p.x, y: p.y, j: 8,
        vx0: -50, vx1: 50, vy0: -40, vy1: 20,
        life: 0.22, r0: 1, r1: 2.4, rgb: CYN, g: 180
      });
    }

    if (wet) {
      p.vx = ax * SWIM;
      if (inU()) p.vy = lerp(p.vy, -SWIM, 1 - Math.pow(0.0008, dt));
      else if (inD()) p.vy = lerp(p.vy, SWIM * 0.85, 1 - Math.pow(0.0008, dt));
      else {
        p.vy += SWIM_GRAV * dt;
        p.vy *= Math.pow(0.22, dt);
      }
      if (p.vy > SWIM_MAX) p.vy = SWIM_MAX;
      if (p.vy < -SWIM) p.vy = -SWIM;
      p.grounded = false;
      p.coyote = 0;
      if (playing() && Math.random() < dt * 4) {
        bubbles.push({ x: p.x + rand(-6, 6), y: p.y - 10, r: rand(1.4, 3.2), vy: -40, life: 0.7 });
        capArr(bubbles, 40);
      }
    } else {
      if (p.grounded) p.vx = ax * WALK;
      else if (ax) p.vx = ax * WALK * AIR;
      else p.vx *= Math.pow(0.22, dt);
    }

    p.x += p.vx * dt;
    p.x = clamp(p.x, 16, G.levelW - 16);
    if (G.boss && G.boss.active && !G.boss.dead) {
      const minX = G.levelW - VW + 18;
      if (p.x < minX) p.x = minX;
    }

    if (inU()) G.jumpBuf = BUFFER;
    else G.jumpBuf -= dt;
    if (G.jumpBuf < 0) G.jumpBuf = 0;

    if (!wet) {
      const canJump = p.grounded || p.coyote > 0;
      if (G.jumpBuf > 0 && canJump) {
        p.vy = -JUMP_V;
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
        hitStop(0.026);
      }
      p.vy += GRAV * dt;
      if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    }

    if (p.grounded && inD() && !wet) {
      let onBase = false;
      let i, pl;
      for (i = 0; i < G.plats.length; i++) {
        pl = G.plats[i];
        if (p.x >= pl.x && p.x <= pl.x + pl.w && Math.abs(p.y - pl.y) < 6) {
          if (pl.base) onBase = true;
        }
      }
      if (!onBase) {
        p.grounded = false;
        p.y += 6;
        G.dropT = 0.16;
      }
    }
    if (G.dropT > 0) G.dropT -= dt;

    const y0 = p.y;
    let y1 = p.y + p.vy * dt;
    if (!wet) p.grounded = false;
    if (p.vy >= 0) {
      const plat = landOn(p.x, y0, y1);
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
        if (plat.base && playing() && !wet) {
          G.checkX = p.x;
          G.checkY = plat.y;
        }
      }
    }
    p.y = y1;
    if (p.grounded) p.coyote = COYOTE;
    else p.coyote -= dt;

    if (p.y > VH + 90) die('fall');

    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
    if (ax && (p.grounded || wet)) p.run += dt * 10;
    else p.run += dt * 2;

    if (G.spitCd > 0) G.spitCd -= dt;
    if (G.spitT > 0) G.spitT -= dt;
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.fireBuf > 0) G.fireBuf -= dt;
    if (G.flameT > 0) {
      G.flameT -= dt;
      if (G.flameT <= 0) {
        G.flameT = 0;
        toast('烈火没了', true, false);
        syncHud();
      }
    }
    if (fireHeld() || G.fireBuf > 0) trySpit();

    if (G.invuln > 0) G.invuln -= dt;

    const pb = pBox();
    let i, u, e;
    for (i = 0; i < G.pickups.length; i++) {
      u = G.pickups[i];
      if (u.taken) continue;
      if (overlap(pb.x, pb.y, pb.w, pb.h, u.x - 10, u.y - 10, 20, 20)) takePickup(u);
    }

    if (playing() && G.invuln <= 0 && G.deadT <= 0) {
      for (i = 0; i < G.ents.length; i++) {
        e = G.ents[i];
        if (e.dead) continue;
        if (overlap(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) {
          hurtPlayer('touch');
          break;
        }
      }
      const b = G.boss;
      if (b && b.active && !b.dead) {
        if (overlap(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.5, b.y - b.h, b.w, b.h)) {
          hurtPlayer('touch');
        }
      }
    }

    if (G.girl && G.girl.free && playing()) {
      if (Math.abs(p.x - G.girl.x) < 22 && Math.abs(p.y - G.girl.y) < 28) {
        goWin();
      }
    }
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    const mul = spdMul(isTide(), G.stage);
    if (e.hitN > 0) e.hitN -= dt;
    e.t += dt;
    if (!onScreen(e.x, 90)) return;
    const p = G.player;

    if (e.kind === 'ape') {
      const dir = p && p.x > e.x ? 1 : -1;
      e.face = dir;
      e.vx = dir * 52 * mul;
      if (e.a && e.x < e.a) e.vx = Math.abs(e.vx);
      if (e.b && e.x > e.b) e.vx = -Math.abs(e.vx);
      if (pitAhead(e.x, e.y, e.vx > 0 ? 1 : -1) && e.grounded && !waterAt(e.x, e.y)) e.vx = 0;
      e.x += e.vx * dt;
      e.vy += GRAV * dt;
      const y0 = e.y;
      e.y += e.vy * dt;
      const plat = landOn(e.x, y0, e.y);
      if (plat) {
        e.y = plat.y;
        e.vy = 0;
        e.grounded = true;
      } else if (e.y > VH + 40) e.dead = true;
    } else if (e.kind === 'frog') {
      const dir = p && p.x > e.x ? 1 : -1;
      e.face = dir;
      e.hopT -= dt;
      if (e.grounded) {
        e.vx = dir * 24 * mul;
        if (e.hopT <= 0) {
          e.vy = -300 - mul * 18;
          e.grounded = false;
          e.hopT = (isTide() ? 0.7 : 0.95) / mul;
          e.vx = dir * 96 * mul;
        }
      }
      e.x += e.vx * dt;
      e.vy += GRAV * dt;
      const y0 = e.y;
      e.y += e.vy * dt;
      const plat = landOn(e.x, y0, e.y);
      if (plat && e.vy >= 0) {
        e.y = plat.y;
        e.vy = 0;
        e.grounded = true;
      } else if (e.y > VH + 40) e.dead = true;
    } else if (e.kind === 'bird') {
      e.face = p && p.x > e.x ? 1 : -1;
      e.x += Math.sin(e.t * 1.4) * 40 * mul * dt * (e.face);
      e.y = e.homeY + Math.sin(e.t * 2.2) * 16;
      e.fire -= dt;
      if (e.fire <= 0 && playing() && p && Math.abs(p.x - e.x) < 260) {
        e.fire = (isTide() ? 1.15 : 1.55) / mul;
        enemyShot(e.x, e.y - 6, e.face * 140 * mul, 40, 1);
      }
    } else if (e.kind === 'fish') {
      e.face = p && p.x > e.x ? 1 : -1;
      const left = e.a || e.homeX - 80;
      const right = e.b || e.homeX + 80;
      e.x += e.face * 70 * mul * dt;
      if (e.x < left) { e.x = left; e.face = 1; }
      if (e.x > right) { e.x = right; e.face = -1; }
      e.y = e.homeY + Math.sin(e.t * 3.1) * 10;
      if (!waterAt(e.x, e.y)) e.y = Math.max(e.y, (waterAt(e.homeX, e.homeY) || { surf: 260 }).surf + 16);
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    if (b.hitN > 0) b.hitN -= dt;
    const p = G.player;
    if (!b.active) {
      if (p && p.x > G.levelW - VW + 80) {
        b.active = true;
        audio.boss();
        toast(b.name, false, true);
        syncHud();
      }
      return;
    }
    b.t += dt;
    b.fire -= dt;
    const mul = spdMul(isTide(), G.stage);
    if (b.kind === '石猿') {
      b.face = p && p.x > b.x ? 1 : -1;
      if (b.grounded) {
        b.vx = b.face * 70 * mul;
        if (b.t % 2.2 < dt * 2) {
          b.vy = -420;
          b.grounded = false;
        }
      }
      b.x += b.vx * dt;
      b.x = clamp(b.x, G.levelW - VW + 40, G.levelW - 40);
      b.vy += GRAV * dt;
      const y0 = b.y;
      b.y += b.vy * dt;
      const plat = landOn(b.x, y0, b.y);
      if (plat && b.vy >= 0) {
        b.y = plat.y;
        b.vy = 0;
        b.grounded = true;
      }
      if (b.fire <= 0) {
        b.fire = (isTide() ? 0.9 : 1.25) / mul;
        enemyShot(b.x + b.face * 16, b.y - 22, b.face * 220 * mul, -80, 1);
      }
    } else if (b.kind === '沼鳄') {
      b.face = p && p.x > b.x ? 1 : -1;
      const cycle = b.t % 3.4;
      if (cycle < 1.4) {
        b.vx = b.face * 90 * mul;
        b.vy = Math.sin(b.t * 3) * 40;
      } else if (cycle < 1.8) {
        b.vx = b.face * 220 * mul;
        b.vy = (p ? (p.y - b.y) * 1.4 : 0);
      } else {
        b.vx *= Math.pow(0.2, dt);
        b.vy *= Math.pow(0.2, dt);
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.x = clamp(b.x, G.levelW - VW + 50, G.levelW - 50);
      b.y = clamp(b.y, 230, GY - 8);
      if (b.fire <= 0) {
        b.fire = (isTide() ? 1.0 : 1.4) / mul;
        enemyShot(b.x + b.face * 20, b.y - 8, b.face * 180 * mul, 0, 1);
      }
    } else {
      b.face = p && p.x > b.x ? 1 : -1;
      b.x += Math.sin(b.t * 1.1) * 70 * mul * dt;
      b.y = b.homeY + Math.sin(b.t * 1.6) * 28;
      b.x = clamp(b.x, G.levelW - VW + 60, G.levelW - 70);
      if (b.fire <= 0) {
        b.fire = (isTide() ? 0.85 : 1.2) / mul;
        enemyShot(b.x + b.face * 18, b.y - 10, b.face * 200 * mul, -40, 1);
        enemyShot(b.x + b.face * 18, b.y - 10, b.face * 190 * mul, 50, 1);
        enemyShot(b.x + b.face * 14, b.y - 18, b.face * 160 * mul, -120, 1);
      }
    }
  }

  function updateShots(dt) {
    let i, s;
    for (i = G.shots.length - 1; i >= 0; i--) {
      s = G.shots[i];
      s.life -= dt;
      s.vy += (s.g || 0) * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rot += dt * 8;
      if (s.life <= 0 || s.x < G.camX - 40 || s.x > G.camX + VW + 40 || s.y < -40 || s.y > VH + 80) {
        G.shots.splice(i, 1);
        continue;
      }
      if (s.own === 'p') {
        let k, e;
        for (k = 0; k < G.ents.length; k++) {
          e = G.ents[k];
          if (e.dead) continue;
          if (overlap(s.x - s.w * 0.5, s.y - s.h * 0.5, s.w, s.h, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) {
            if (!s.hit['e' + e.id]) {
              s.hit['e' + e.id] = true;
              hurtEnt(e, s.dmg, s.x, s.y);
              G.shots.splice(i, 1);
              s = null;
              break;
            }
          }
        }
        if (!s) continue;
        const b = G.boss;
        if (b && b.active && !b.dead) {
          if (overlap(s.x - s.w * 0.5, s.y - s.h * 0.5, s.w, s.h, b.x - b.w * 0.5, b.y - b.h, b.w, b.h)) {
            if (!s.hit['b' + b.id]) {
              s.hit['b' + b.id] = true;
              hurtBoss(s.dmg, s.x, s.y);
              G.shots.splice(i, 1);
            }
          }
        }
      } else if (playing() && G.player && G.deadT <= 0) {
        const pb = pBox();
        if (overlap(s.x - s.w * 0.5, s.y - s.h * 0.5, s.w, s.h, pb.x, pb.y, pb.w, pb.h)) {
          G.shots.splice(i, 1);
          hurtPlayer('shot');
        }
      }
    }
  }

  function updateCam(dt) {
    const p = G.player;
    if (!p) return;
    let tx = p.x - VW * 0.36 + p.face * 52;
    if (G.boss && G.boss.active && !G.boss.dead) tx = G.levelW - VW;
    if (G.girl && G.girl.free) tx = G.levelW - VW;
    tx = clamp(tx, 0, Math.max(0, G.levelW - VW));
    G.camX = lerp(G.camX, tx, 1 - Math.pow(0.001, dt));
    let ty = 0;
    if (p.y < HY + 20) ty = p.y - HY - 10;
    ty = clamp(ty, -40, 0);
    G.camY = lerp(G.camY, ty, 1 - Math.pow(0.002, dt));
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0002, dt));
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
  }

  function updateFx(dt) {
    let i, o;
    for (i = particles.length - 1; i >= 0; i--) {
      o = particles[i];
      o.life -= dt;
      o.vy += (o.g || 420) * dt;
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
    for (i = bubbles.length - 1; i >= 0; i--) {
      o = bubbles[i];
      o.life -= dt;
      o.y += o.vy * dt;
      o.x += Math.sin(G.clock * 6 + i) * 8 * dt;
      if (o.life <= 0) bubbles.splice(i, 1);
    }
    for (i = 0; i < mist.length; i++) {
      o = mist[i];
      o.x += o.vx * dt;
      if (o.x > G.camX + VW + 80) o.x = G.camX - 60;
    }
    for (i = 0; i < leaves.length; i++) {
      o = leaves[i];
      o.x += o.vx * dt;
      o.y += Math.sin(G.clock * 2 + i) * 12 * dt;
      o.rot += o.vr * dt;
      if (o.x > G.camX + VW + 40) {
        o.x = G.camX - 30;
        o.y = rand(40, 260);
      }
    }
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
    if (G.girl) G.girl.t += dt;
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
    if (G.mode === 'title') demoThink();
    if (autoOn && G.mode === 'play' && G.deadT <= 0) autoThink();
    updatePlayer(dt);
    for (let i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt);
    updateBoss(dt);
    updateShots(dt);
    updateCam(dt);
  }

  function drawSky() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (spec.theme === 'rock') {
      g.addColorStop(0, '#1c0c06');
      g.addColorStop(0.5, '#140806');
      g.addColorStop(1, '#0c0604');
    } else if (spec.theme === 'pool') {
      g.addColorStop(0, '#0c1820');
      g.addColorStop(0.5, '#0a1218');
      g.addColorStop(1, '#081014');
    } else {
      g.addColorStop(0, '#1a1006');
      g.addColorStop(0.5, '#120c06');
      g.addColorStop(1, '#0c0804');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const mx = sx(G.camX + VW * 0.78);
    const my = sy(G.camY + 44);
    ctx.fillStyle = rgba(isTide() ? MAG : HOT, isTide() ? 0.72 : 0.55);
    ctx.beginPath();
    ctx.arc(mx, my, (isTide() ? 26 : 22) * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.28);
    ctx.beginPath();
    ctx.arc(mx - 5 * scale, my - 4 * scale, 8 * scale, 0, TAU);
    ctx.fill();

    let i, sx0, sy0;
    for (i = 0; i < 16; i++) {
      sx0 = sx((hash2(i + G.stage * 3) * G.levelW) - G.camX * 0.15);
      sy0 = oy + (12 + hash2(i + 9) * 70) * scale;
      ctx.fillStyle = rgba(WHT, 0.16 + hash2(i + 2) * 0.22);
      ctx.fillRect(sx0, sy0, 1.4 * scale, 1.4 * scale);
    }
  }

  function drawBackdrop() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const par = G.camX * 0.3;
    const base = sy(GY + 6);
    let i, x, h, w;
    for (i = -2; i < 26; i++) {
      x = sx((Math.floor((G.camX + par) / 76) + i) * 76 - par);
      h = (40 + hash2(i + 17 + G.stage * 9) * 96) * scale;
      w = (28 + hash2(i + 5) * 30) * scale;
      if (spec.theme === 'rock') {
        ctx.fillStyle = i % 3 === 0 ? '#24140c' : '#1a0e08';
        ctx.fillRect(x, base - h, w, h + 40 * scale);
        ctx.fillStyle = hash2(i + 3) > 0.45 ? rgba(HOT, 0.28) : rgba(GOLD, 0.12);
        ctx.fillRect(x + 6 * scale, base - h + 10 * scale, 4 * scale, 5 * scale);
      } else if (spec.theme === 'pool') {
        ctx.fillStyle = i % 2 ? '#102028' : '#0c181e';
        ctx.beginPath();
        ctx.moveTo(x, base);
        ctx.lineTo(x + w * 0.2, base - h * 0.7);
        ctx.lineTo(x + w, base - h * 0.35);
        ctx.lineTo(x + w, base);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = i % 2 ? '#16120a' : '#120e08';
        ctx.beginPath();
        ctx.moveTo(x, base);
        ctx.lineTo(x + w * 0.5, base - h);
        ctx.lineTo(x + w, base);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(LEAF, 0.18);
        ctx.beginPath();
        ctx.arc(x + w * 0.5, base - h + 6 * scale, 8 * scale, 0, TAU);
        ctx.fill();
      }
    }
    for (i = 0; i < mist.length; i++) {
      const m = mist[i];
      ctx.fillStyle = rgba(isTide() ? MAG : WHT, m.a * (isTide() ? 1.2 : 1));
      ctx.beginPath();
      ctx.arc(sx(m.x), sy(m.y), m.r * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < leaves.length; i++) {
      const lf = leaves[i];
      ctx.save();
      ctx.translate(sx(lf.x), sy(lf.y));
      ctx.rotate(lf.rot);
      ctx.fillStyle = rgba(lf.rgb, 0.28);
      ctx.fillRect(-3 * scale, -1.4 * scale, 6 * scale, 2.6 * scale);
      ctx.restore();
    }
  }

  function drawPits() {
    const y = sy(GY + 8);
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const lava = spec.theme === 'rock';
    ctx.fillStyle = lava ? 'rgba(24, 6, 2, 0.78)' : 'rgba(4, 8, 10, 0.72)';
    ctx.fillRect(sx(G.camX - 10), y, (VW + 20) * scale, 56 * scale);
    ctx.strokeStyle = rgba(lava ? HOT : TEAL, 0.28);
    ctx.lineWidth = 1.3 * scale;
    ctx.beginPath();
    let x;
    for (x = G.camX - 20; x < G.camX + VW + 20; x += 8) {
      const yy = GY + 10 + Math.sin(x * 0.09 + G.clock * 2.8) * 2.2;
      if (x === G.camX - 20) ctx.moveTo(sx(x), sy(yy));
      else ctx.lineTo(sx(x), sy(yy));
    }
    ctx.stroke();
    let covered, wet;
    for (x = G.camX; x < G.camX + VW; x += 16) {
      covered = false;
      wet = !!waterAt(x + 8, GY + 10);
      for (let i = 0; i < G.plats.length; i++) {
        const p = G.plats[i];
        if (p.base && x >= p.x && x <= p.x + p.w) { covered = true; break; }
      }
      if (!covered && !wet) {
        ctx.fillStyle = rgba(HOT, 0.12 + Math.sin(x * 0.04 + G.clock * 3) * 0.05);
        ctx.fillRect(sx(x), y, 16 * scale, 40 * scale);
      }
    }
  }

  function drawWater() {
    let i, w, x, s;
    s = scale;
    for (i = 0; i < G.waters.length; i++) {
      w = G.waters[i];
      if (w.x + w.w < G.camX - 20 || w.x > G.camX + VW + 20) continue;
      const left = Math.max(w.x, G.camX - 10);
      const right = Math.min(w.x + w.w, G.camX + VW + 10);
      const ww = right - left;
      ctx.fillStyle = 'rgba(12, 64, 80, 0.55)';
      ctx.fillRect(sx(left), sy(w.surf), ww * s, (VH - w.surf + 40) * s);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.fillRect(sx(left), sy(w.surf), ww * s, 18 * s);
      ctx.strokeStyle = rgba(CYN, 0.45);
      ctx.lineWidth = 1.6 * s;
      ctx.beginPath();
      for (x = left; x <= right; x += 6) {
        const yy = w.surf + Math.sin(x * 0.12 + G.clock * 4) * 2.4;
        if (x === left) ctx.moveTo(sx(x), sy(yy));
        else ctx.lineTo(sx(x), sy(yy));
      }
      ctx.stroke();
    }
    for (i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];
      ctx.strokeStyle = rgba(CYN, clamp(b.life / 0.7, 0, 1) * 0.55);
      ctx.lineWidth = 1 * s;
      ctx.beginPath();
      ctx.arc(sx(b.x), sy(b.y), b.r * s, 0, TAU);
      ctx.stroke();
    }
  }

  function drawPlats() {
    const s = scale;
    const spec = STAGES[G.stage - 1] || STAGES[0];
    let i, p, x, y, w;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (p.x + p.w < G.camX - 20 || p.x > G.camX + VW + 20) continue;
      x = sx(p.x);
      y = sy(p.y);
      w = p.w * s;
      if (p.base) {
        ctx.fillStyle = spec.theme === 'pool' ? '#1a2a28' : '#2a1c10';
        ctx.fillRect(x, y, w, 42 * s);
        ctx.fillStyle = spec.theme === 'rock' ? '#3a2214' : '#3a2814';
        ctx.fillRect(x, y, w, 8 * s);
        ctx.fillStyle = rgba(HOT, 0.28);
        ctx.fillRect(x, y, w, 2.2 * s);
        let t;
        for (t = 6; t < p.w; t += 18) {
          ctx.fillStyle = 'rgba(0,0,0,0.22)';
          ctx.fillRect(sx(p.x + t), y + 12 * s, 8 * s, 18 * s);
        }
      } else {
        ctx.fillStyle = '#24180e';
        ctx.fillRect(x, y, w, 10 * s);
        ctx.fillStyle = rgba(GOLD, 0.28);
        ctx.fillRect(x, y, w, 2 * s);
      }
    }
  }

  function drawPickup(u) {
    if (u.taken) return;
    if (!onScreen(u.x, 16)) return;
    const bob = Math.sin(G.clock * 4 + u.x * 0.02) * 3;
    const x = sx(u.x);
    const y = sy(u.y + bob);
    const banana = u.kind === 'banana';
    const rgb = banana ? GOLD : HOT;
    ctx.fillStyle = rgba(rgb, 0.2);
    ctx.beginPath();
    ctx.arc(x, y, 11 * scale, 0, TAU);
    ctx.fill();
    if (banana) {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.ellipse(x, y, 4 * scale, 8 * scale, 0.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(LEAF, 0.9);
      ctx.fillRect(x - 1 * scale, y - 9 * scale, 3 * scale, 3 * scale);
    } else {
      ctx.fillStyle = rgba(HOT, 0.95);
      ctx.beginPath();
      ctx.arc(x, y, 6 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(x - 1 * scale, y - 1 * scale, 2.4 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawEnt(e) {
    if (e.dead) return;
    if (!onScreen(e.x, 24)) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const flash = e.hitN > 0 && ((G.t * 24) | 0) % 2 === 0;
    const s = scale;
    if (e.kind === 'bird') {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(e.face, 1);
      const wing = Math.sin(G.clock * 10 + e.id) * 5 * s;
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : rgba(FUR2, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, -6 * s, 8 * s, 5 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.85);
      ctx.beginPath();
      ctx.moveTo(6 * s, -6 * s);
      ctx.lineTo(12 * s, -4 * s);
      ctx.lineTo(6 * s, -2 * s);
      ctx.fill();
      ctx.fillStyle = rgba(FUR, 0.9);
      ctx.beginPath();
      ctx.moveTo(-2 * s, -6 * s);
      ctx.lineTo(-14 * s, -12 * s - wing);
      ctx.lineTo(-4 * s, 0);
      ctx.fill();
      ctx.restore();
      return;
    }
    if (e.kind === 'fish') {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(e.face, 1);
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : rgba(TEAL, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, -4 * s, 8 * s, 4.5 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.9);
      ctx.beginPath();
      ctx.moveTo(-7 * s, -4 * s);
      ctx.lineTo(-13 * s, -9 * s);
      ctx.lineTo(-13 * s, 1 * s);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(3 * s, -5 * s, 1.4 * s, 0, TAU);
      ctx.fill();
      ctx.restore();
      return;
    }
    if (e.kind === 'frog') {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(e.face, 1);
      const bounce = e.grounded ? 0 : -3 * s;
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : rgba(LEAF, 0.92);
      ctx.beginPath();
      ctx.ellipse(0, -7 * s + bounce, 9 * s, 6.5 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(4 * s, -10 * s + bounce, 2.2 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.85);
      ctx.fillRect(2 * s, -4 * s + bounce, 4 * s, 2 * s);
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(e.face, 1);
    const walk = Math.sin(e.t * 7) * 3 * s;
    ctx.fillStyle = flash ? rgba(WHT, 0.9) : rgba(FUR2, 0.96);
    ctx.fillRect(-5 * s, -14 * s, 10 * s, 10 * s);
    ctx.fillStyle = rgba(FUR, 0.96);
    ctx.beginPath();
    ctx.arc(1 * s, -18 * s, 6 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MUZ, 0.95);
    ctx.beginPath();
    ctx.ellipse(5 * s, -16 * s, 4 * s, 2.6 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a1008';
    ctx.beginPath();
    ctx.arc(3 * s, -19 * s, 1.2 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(FUR2, 0.95);
    ctx.fillRect(-5 * s, -6 * s, 3 * s, 6 * s + walk);
    ctx.fillRect(2 * s, -6 * s, 3 * s, 6 * s - walk);
    ctx.restore();
  }

  function drawBoss() {
    const b = G.boss;
    if (!b || b.dead) return;
    if (!b.active && !onScreen(b.x, 20)) return;
    const x = sx(b.x);
    const y = sy(b.y);
    const flash = b.hitN > 0 && ((G.t * 24) | 0) % 2 === 0;
    const s = scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(b.face, 1);
    if (b.kind === '沼鳄') {
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#2a6048';
      ctx.beginPath();
      ctx.ellipse(0, -8 * s, 22 * s, 10 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(LEAF, 0.7);
      ctx.fillRect(-8 * s, -16 * s, 4 * s, 4 * s);
      ctx.fillRect(2 * s, -16 * s, 4 * s, 4 * s);
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.beginPath();
      ctx.ellipse(16 * s, -8 * s, 8 * s, 5 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(18 * s, -10 * s, 1.8 * s, 0, TAU);
      ctx.fill();
    } else if (b.kind === '炎龙') {
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : rgba(HOT, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, -10 * s, 18 * s, 11 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(10 * s, -22 * s, 8 * s, 0, TAU);
      ctx.fill();
      const wing = Math.sin(G.clock * 8) * 8 * s;
      ctx.fillStyle = rgba(MAG, 0.75);
      ctx.beginPath();
      ctx.moveTo(-4 * s, -10 * s);
      ctx.lineTo(-28 * s, -26 * s - wing);
      ctx.lineTo(-8 * s, 4 * s);
      ctx.fill();
      ctx.fillStyle = rgba(HOT2, 0.9);
      ctx.beginPath();
      ctx.moveTo(16 * s, -18 * s);
      ctx.lineTo(26 * s, -14 * s);
      ctx.lineTo(16 * s, -10 * s);
      ctx.fill();
    } else {
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : rgba(FUR2, 0.96);
      ctx.fillRect(-12 * s, -20 * s, 24 * s, 18 * s);
      ctx.fillStyle = rgba(FUR, 0.96);
      ctx.beginPath();
      ctx.arc(2 * s, -28 * s, 12 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(MUZ, 0.95);
      ctx.beginPath();
      ctx.ellipse(10 * s, -24 * s, 8 * s, 5 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#1a1008';
      ctx.beginPath();
      ctx.arc(6 * s, -30 * s, 2 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.7);
      ctx.fillRect(-12 * s, -8 * s, 8 * s, 8 * s);
      ctx.fillRect(4 * s, -8 * s, 8 * s, 8 * s);
    }
    ctx.restore();
  }

  function drawGirl() {
    const g = G.girl;
    if (!g) return;
    if (!onScreen(g.x, 20) && !g.free) return;
    const x = sx(g.x);
    const y = sy(g.y);
    const s = scale;
    const bob = Math.sin(g.t * 3) * 2 * s;
    if (g.cage) {
      ctx.strokeStyle = rgba(GOLD, 0.7);
      ctx.lineWidth = 2 * s;
      ctx.strokeRect(x - 14 * s, y - 40 * s, 28 * s, 40 * s);
      ctx.beginPath();
      ctx.moveTo(x - 14 * s, y - 40 * s);
      ctx.lineTo(x, y - 52 * s);
      ctx.lineTo(x + 14 * s, y - 40 * s);
      ctx.stroke();
    }
    ctx.fillStyle = rgba(PNK, 0.95);
    ctx.beginPath();
    ctx.ellipse(x, y - 14 * s + bob, 6 * s, 10 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MUZ, 0.96);
    ctx.beginPath();
    ctx.arc(x, y - 28 * s + bob, 5.2 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.85);
    ctx.beginPath();
    ctx.arc(x, y - 32 * s + bob, 5.6 * s, Math.PI, TAU);
    ctx.fill();
    if (g.free) {
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.font = 'bold ' + (9 * s) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('救', x, y - 48 * s);
    }
  }

  function drawShot(s) {
    const x = sx(s.x);
    const y = sy(s.y);
    const sc = scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(s.rot * 0.4);
    ctx.fillStyle = rgba(s.rgb, 0.95);
    ctx.beginPath();
    ctx.arc(0, 0, (s.big ? 6.4 : 4.6) * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.75);
    ctx.beginPath();
    ctx.arc(-1.2 * sc, -1.2 * sc, (s.big ? 2.4 : 1.6) * sc, 0, TAU);
    ctx.fill();
    if (s.own === 'p') {
      ctx.fillStyle = rgba(HOT, 0.35);
      ctx.beginPath();
      ctx.ellipse(-6 * sc, 0, 8 * sc, 3 * sc, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawApe(p) {
    if (G.invuln > 0 && playing() && ((G.t * 14) | 0) % 3 === 0) return;
    const s = scale;
    const sq = p.squash || 1;
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 1.4 * s, 7.5 * s, 2.2 * s, 0, 0, TAU);
    ctx.fill();
    ctx.scale(p.face, sq);
    const leg = Math.sin(p.run || 0) * 4.5 * s;
    const spitOff = G.spitT > 0 ? 4 * s : 0;

    ctx.strokeStyle = rgba(FUR2, 0.95);
    ctx.lineWidth = 2.4 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3.4 * s, -7 * s);
    ctx.lineTo(-4.2 * s + (p.grounded || p.swim ? -leg : 2 * s), 0);
    ctx.moveTo(3.4 * s, -7 * s);
    ctx.lineTo(4.2 * s + (p.grounded || p.swim ? leg : -2 * s), 0);
    ctx.stroke();

    ctx.strokeStyle = rgba(FUR, 0.9);
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(-6 * s, -12 * s);
    ctx.quadraticCurveTo(-16 * s, -4 * s, -10 * s, 2 * s);
    ctx.stroke();

    ctx.fillStyle = rgba(FUR2, 0.96);
    ctx.beginPath();
    ctx.ellipse(0, -12 * s, 8.2 * s, 9 * s, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = rgba(FUR, 0.96);
    ctx.beginPath();
    ctx.arc(1 * s, -22 * s, 8.4 * s, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-6 * s, -26 * s, 3.2 * s, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6 * s, -26 * s, 3.2 * s, 0, TAU);
    ctx.fill();

    ctx.fillStyle = rgba(MUZ, 0.96);
    ctx.beginPath();
    ctx.ellipse(5 * s + spitOff * 0.3, -18 * s, (7 + spitOff * 0.15) * 0.55 + 3.2 * s, 4.2 * s, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#1a1008';
    ctx.beginPath();
    ctx.arc(2.4 * s, -23 * s, 1.5 * s, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6.4 * s, -23.4 * s, 1.5 * s, 0, TAU);
    ctx.fill();

    ctx.fillStyle = rgba(HOT, 0.85);
    ctx.beginPath();
    ctx.ellipse(8 * s + spitOff, -17 * s, 2.2 * s + spitOff * 0.2, 1.5 * s, 0, 0, TAU);
    ctx.fill();

    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(12 * s + spitOff, -17 * s, 4.2 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.beginPath();
      ctx.arc(14 * s + spitOff, -17 * s, 2.2 * s, 0, TAU);
      ctx.fill();
    }

    if (G.flameT > 0) {
      ctx.strokeStyle = rgba(HOT, 0.45 + Math.sin(G.clock * 12) * 0.2);
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.arc(0, -14 * s, 16 * s, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBossBar() {
    const b = G.boss;
    if (!b || !b.active || b.dead || !playing()) return;
    let x = ox + 80 * scale;
    let y = oy + 12 * scale;
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
    ctx.fillStyle = '#0e0803';
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
    drawWater();

    let i;
    for (i = 0; i < G.pickups.length; i++) drawPickup(G.pickups[i]);
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawBoss();
    drawGirl();
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);

    if (G.player && G.deadT <= 0) drawApe(G.player);

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
      if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
      if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') {
        keys.u = down;
        if (down && live()) G.jumpBuf = BUFFER;
      }
      if (space) {
        keys.fire = down;
        if (down && live()) G.fireBuf = BUFFER;
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
      startGame('save');
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
    hold(document.getElementById('btn-jump'), function () { keys.u = true; if (live()) G.jumpBuf = BUFFER; }, function () { keys.u = false; });
    hold(document.getElementById('btn-spit'), function () { keys.fire = true; if (live()) G.fireBuf = BUFFER; }, function () { keys.fire = false; });
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen() || autoOn) return;
      keys.fire = true;
      if (live()) G.fireBuf = BUFFER;
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

  if (btnSave) {
    btnSave.addEventListener('click', function () {
      audio.ensure();
      startGame('save');
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
  if (modeSave) {
    modeSave.addEventListener('click', function () {
      audio.ensure();
      startGame('save');
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
