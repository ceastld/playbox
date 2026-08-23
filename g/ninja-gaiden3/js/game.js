'use strict';

(function () {
  const VW = 640;
  const VH = 360;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 15000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const GY = 328;
  const MY = 256;
  const HY = 184;
  const WALK = 196;
  const AIR = 0.88;
  const JUMP_V = 480;
  const JUMP_WALL = 452;
  const GRAV = 1380;
  const MAX_FALL = 560;
  const WALL_SLIDE = 84;
  const WALL_KICK_VX = 214;
  const COYOTE = 0.09;
  const BUFFER = 0.12;
  const PW = 14;
  const PH = 26;
  const MELEE = 44;
  const MELEE2 = 58;
  const ATK_CD = 0.2;
  const SLASH_T = 0.16;
  const INVULN = 1.32;
  const DIE_T = 0.8;
  const KNIFE_SPD = 250;
  const BEST_KEY = 'playbox-ninja-gaiden3-best';
  const MUTE_KEY = 'playbox-ninja-gaiden3-mute';
  const OPS = '方向键 / WASD 走 · Shift / ↑ 跳 · 空格 / Z 斩 · 下掉落 · R 重开 · M 静音';

  const MAG = [255, 61, 122];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 46, 10];
  const HOT2 = [255, 106, 58];
  const WHT = [246, 239, 232];
  const PUR = [168, 92, 255];
  const CRIM = [196, 24, 40];
  const BLOOD = [200, 18, 36];
  const BONE = [232, 210, 186];

  const SCORE = {
    ash: 100, gun: 200, bat: 150, claw: 180, clone: 250,
    boss: 4500, stage: 1800, jade: 400
  };

  const STAGES = [
    {
      name: '绝壁', boss: '岩魔', w: 2200, hp: 12, theme: 'cliff',
      ground: [[0, 560], [680, 420], [1240, 960]],
      plats: [
        [160, MY, 140], [400, MY, 160], [760, MY, 150],
        [1020, MY, 180], [1440, MY, 160], [1760, MY, 150],
        [420, HY, 120], [1060, HY, 140], [1480, HY, 130]
      ],
      walls: [
        [350, HY - 12, GY], [400, MY - 8, GY],
        [760, HY - 16, GY], [808, HY - 16, GY],
        [1020, MY - 8, GY], [1440, HY - 12, GY],
        [1760, MY - 8, GY]
      ],
      ents: [
        [280, GY, 'ash', 40, 540],
        [480, GY, 'gun', 80, 560],
        [430, HY, 'bat', 400, 540],
        [350, 250, 'claw', HY - 8, GY - 20],
        [820, GY, 'ash', 700, 1080],
        [880, MY, 'clone', 760, 910],
        [1100, HY, 'gun', 1060, 1200],
        [1320, GY, 'ash', 1260, 1980],
        [1520, MY, 'bat', 1440, 1600],
        [1760, GY, 'gun', 1260, 2100],
        [1760, 240, 'claw', MY - 8, GY - 16]
      ],
      loot: [[980, MY, 'jade'], [1520, HY, 'jade']]
    },
    {
      name: '血廊', boss: '血影', w: 2520, hp: 16, theme: 'lab',
      ground: [[0, 460], [560, 380], [1080, 360], [1580, 940]],
      plats: [
        [80, MY, 140], [300, MY, 150], [620, MY, 170],
        [900, MY, 150], [1180, MY, 180], [1480, MY, 150],
        [1900, MY, 180], [2260, MY, 140],
        [320, HY, 120], [680, HY, 140], [1220, HY, 150],
        [1520, HY, 130], [1940, HY, 140]
      ],
      walls: [
        [220, HY - 12, GY], [300, MY - 8, GY],
        [620, HY - 16, GY], [668, HY - 16, GY],
        [900, MY - 8, GY], [1180, HY - 12, GY],
        [1480, MY - 8, GY], [1900, HY - 16, GY],
        [1948, HY - 16, GY], [2260, MY - 8, GY]
      ],
      ents: [
        [200, GY, 'ash', 20, 440],
        [340, MY, 'gun', 300, 450],
        [360, HY, 'bat', 320, 440],
        [220, 240, 'claw', HY - 8, GY - 18],
        [700, GY, 'clone', 580, 920],
        [740, MY, 'ash', 620, 790],
        [720, HY, 'gun', 680, 820],
        [1040, GY, 'ash', 580, 1060],
        [1240, MY, 'clone', 1180, 1360],
        [1280, HY, 'bat', 1220, 1370],
        [1540, GY, 'gun', 1100, 1540],
        [1820, GY, 'ash', 1620, 2360],
        [1980, MY, 'clone', 1900, 2080],
        [2020, HY, 'bat', 1940, 2080],
        [1900, 230, 'claw', HY - 8, GY - 16],
        [2300, GY, 'gun', 1680, 2480]
      ],
      loot: [[940, MY, 'jade'], [1540, HY, 'jade'], [2140, MY, 'jade']]
    },
    {
      name: '古舰', boss: '舰主', w: 2760, hp: 22, theme: 'ship',
      ground: [[0, 420], [500, 340], [960, 380], [1460, 360], [1960, 800]],
      plats: [
        [60, MY, 130], [260, MY, 150], [560, MY, 160],
        [840, MY, 150], [1120, MY, 180], [1420, MY, 150],
        [1700, MY, 170], [2060, MY, 190], [2440, MY, 140],
        [280, HY, 120], [600, HY, 140], [1160, HY, 150],
        [1740, HY, 150], [2100, HY, 160], [2460, HY, 120]
      ],
      walls: [
        [180, HY - 12, GY], [260, MY - 8, GY],
        [560, HY - 16, GY], [608, HY - 16, GY],
        [840, MY - 8, GY], [1120, HY - 12, GY],
        [1420, MY - 8, GY], [1700, HY - 16, GY],
        [1748, HY - 16, GY], [2060, MY - 8, GY],
        [2440, HY - 12, GY]
      ],
      ents: [
        [190, GY, 'ash', 20, 400],
        [300, MY, 'gun', 260, 410],
        [320, HY, 'clone', 280, 400],
        [180, 240, 'claw', HY - 8, GY - 18],
        [620, GY, 'ash', 520, 840],
        [640, MY, 'bat', 560, 720],
        [660, HY, 'gun', 600, 740],
        [1080, GY, 'clone', 980, 1320],
        [1160, MY, 'ash', 1120, 1300],
        [1200, HY, 'bat', 1160, 1310],
        [1540, GY, 'gun', 1480, 1820],
        [1580, MY, 'clone', 1420, 1570],
        [1760, MY, 'ash', 1700, 1870],
        [1800, HY, 'bat', 1740, 1900],
        [1700, 230, 'claw', HY - 8, GY - 16],
        [2120, GY, 'ash', 2000, 2660],
        [2180, MY, 'clone', 2060, 2250],
        [2140, HY, 'gun', 2100, 2260],
        [2480, MY, 'bat', 2440, 2580],
        [2440, 236, 'claw', HY - 8, GY - 16]
      ],
      loot: [[880, MY, 'jade'], [1440, MY, 'jade'], [2120, HY, 'jade']]
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
  function wallJumpHeight() {
    return (JUMP_WALL * JUMP_WALL) / (2 * GRAV);
  }
  function spdMul(core, stage) {
    return (core ? 1.34 : 1) * (1 + Math.max(0, stage - 1) * 0.07);
  }
  function bossHp(spec, core) {
    return core ? Math.ceil(spec.hp * 1.22) : spec.hp;
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
  function meleeRange(n) {
    return n >= 2 ? MELEE2 : MELEE;
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
    const wh = wallJumpHeight();
    if (wh < 68 || wh > 92) throw new Error('wall jump ' + wh);
    if (wh >= h) throw new Error('wall jump vs jump');
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('core faster');
    if (spdMul(false, 2) <= spdMul(false, 1)) throw new Error('later faster');
    if (MELEE < 36) throw new Error('melee range');
    if (MELEE2 <= MELEE) throw new Error('vacuum slash longer');
    if (WALL_KICK_VX < WALK) throw new Error('wall kick speed');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    if (STAGES[2].boss !== '舰主') throw new Error('ship boss');
    if (STAGES[0].name !== '绝壁' || STAGES[1].name !== '血廊') throw new Error('stage names');
    if (BEST_KEY !== 'playbox-ninja-gaiden3-best') throw new Error('best key');
    let i, s, j, claws;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ground.length) throw new Error('ground');
      if (s.host) throw new Error('no hostages');
      if (!s.ents.length) throw new Error('ents');
      if (!s.walls || s.walls.length < 4) throw new Error('walls ' + s.name);
      if (!s.loot.length) throw new Error('loot');
      claws = 0;
      for (j = 0; j < s.ents.length; j++) {
        if (s.ents[j][2] === 'claw') claws += 1;
        if (s.ents[j][0] < 10 || s.ents[j][0] > s.w - 20) throw new Error('ent x');
      }
      if (claws < 1) throw new Error('claw ' + s.name);
      for (j = 0; j < s.loot.length; j++) {
        if (s.loot[j][0] < 40 || s.loot[j][0] > s.w - 80) throw new Error('loot x');
        if (s.loot[j][2] !== 'jade') throw new Error('loot kind');
      }
    }
    if (bossHp(STAGES[2], true) <= bossHp(STAGES[2], false)) throw new Error('core boss thicker');
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
  const btnRaid = document.getElementById('btn-raid');
  const btnCore = document.getElementById('btn-core');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeRaid = document.getElementById('mode-raid');
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
  const clingLabel = document.getElementById('cling-label');
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

  const keys = { l: false, r: false, u: false, d: false, up: false, jump: false };
  const demo = { l: false, r: true, u: false };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const embers = [];
  const bloods = [];

  const G = {
    mode: 'title',
    kind: 'raid',
    t: 0,
    clock: 0,
    stage: 1,
    camX: 0,
    camY: 0,
    levelW: 2200,
    plats: [],
    walls: [],
    ents: [],
    knives: [],
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
    checkX: 70,
    checkY: GY,
    atkCd: 0,
    slashT: 0,
    slashN: 0,
    slashHit: 0,
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
    gate: 1980
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
    cling() {
      this.ensure();
      this.noise(0.05, 0.03, 1600);
      this.beep(720, 0.04, 'square', 0.028, 420);
    },
    wall() {
      this.ensure();
      this.noise(0.06, 0.04, 700);
      this.beep(240, 0.08, 'sawtooth', 0.04, 880);
    },
    slash(n) {
      this.ensure();
      const lift = 1 + (n - 1) * 0.16;
      this.noise(0.05, 0.044, 1400);
      this.beep(400 * lift, 0.08, 'sawtooth', 0.052, 160);
      if (n >= 2) this.beep(980, 0.1, 'square', 0.032, 240);
    },
    ping(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.55, combo * 0.05);
      this.beep(1180 * lift, 0.07, 'triangle', 0.05, 1760 * lift);
      this.beep(1760 * lift, 0.05, 'sine', 0.028, 2200 * lift);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.05, 0.04, 900);
      this.beep(480 * lift, 0.08, 'square', 0.046, 820 * lift);
    },
    pickup() {
      this.ensure();
      this.beep(523, 0.07, 'square', 0.04, 784);
      this.beep(784, 0.1, 'triangle', 0.032, 1046);
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
    if (modeRaid) modeRaid.setAttribute('aria-pressed', core ? 'false' : 'true');
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
      tagLabel.textContent = isCore() ? '影核' : '忍影3';
      tagLabel.classList.toggle('warn', isCore());
      tagLabel.classList.toggle('hot', !isCore() && G.stage >= 3);
    }
    const clinging = !!(G.player && G.player.cling);
    if (clingLabel) clingLabel.classList.toggle('on', clinging);
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 挨打、中弹、坠崖都丢命', 'warn');
    else if (G.mode === 'win') setHint('古舰已破 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 近斩 · 贴墙蹬墙', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('头目 · 近斩 · 贴墙躲开', 'hot');
    else if (clinging) setHint('贴墙中 · 跳蹬出去 · 空格下斩', 'hot');
    else setHint('走跳 · 空格 / Z 近斩 · Shift 跳 · 贴墙蹬墙', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'NG3';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.innerHTML = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' && !isCore() ? '影核' : '换模式';
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
    stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'wall');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'wall');
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

  function sprayBlood(x, y, face, power) {
    const p = power || 1;
    const n = REDUCE ? 5 : (10 + (p * 8) | 0);
    let i;
    for (i = 0; i < n; i++) {
      bloods.push({
        x: x + rand(-6, 6),
        y: y + rand(-8, 6),
        vx: rand(-40, 40) + (face || 0) * rand(40, 180),
        vy: rand(-260, -40) * p,
        r: rand(1.2, 2.8 + p),
        life: rand(0.28, 0.55 + p * 0.12),
        max: 0.62,
        g: 760
      });
    }
    capArr(bloods, 160);
    emit(REDUCE ? 4 : 8, {
      x: x, y: y, j: 6 + p * 4,
      vx0: -160 * p, vx1: 160 * p, vy0: -240 * p, vy1: -10,
      life: 0.26 + p * 0.1, r0: 1, r1: 2.4 + p, rgb: GOLD, g: 180
    });
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
      squash: 1, run: 0, pose: 0,
      cling: 0, wall: null, wallCool: 0
    };
  }

  function makePlat(x, y, w, base) {
    return { x: x, y: y, w: w, h: base ? 48 : 12, base: !!base };
  }

  function makeEnt(x, y, kind, a, b) {
    const hp = kind === 'clone' ? 2 : 1;
    const fly = kind === 'bat';
    const claw = kind === 'claw';
    return {
      id: uid++,
      x: x, y: y, vx: 0, vy: 0, face: 1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b, t: rand(0, 1),
      fire: rand(0.4, 1.2),
      flyY: fly ? y : 0,
      climb: claw ? (Math.random() < 0.5 ? 1 : -1) : 0,
      grounded: !fly && !claw, dead: false,
      hitN: 0,
      w: kind === 'gun' ? 16 : kind === 'clone' ? 14 : kind === 'claw' ? 12 : 14,
      h: fly ? 14 : kind === 'claw' ? 16 : kind === 'clone' ? 26 : 24
    };
  }

  function makeBoss(spec) {
    return {
      id: uid++,
      x: spec.w - 140, y: GY, vx: 0, vy: 0, face: -1,
      hp: bossHp(spec, isCore()), max: bossHp(spec, isCore()),
      kind: spec.boss, t: 0, fire: 1.1, spawn: 2.4,
      state: 'wait', grounded: true, dead: false, active: false,
      hitN: 0, w: G.stage >= 3 ? 24 : 20, h: G.stage >= 3 ? 34 : 32,
      name: spec.boss
    };
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
    G.walls = [];
    for (i = 0; i < spec.walls.length; i++) {
      const w = spec.walls[i];
      G.walls.push({ x: w[0], y0: w[1], y1: w[2] });
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
        if (e[2] === 'claw' || e[2] === 'bat') continue;
        const nx = e[0] + 56;
        if (!platUnder(nx, e[1], null)) continue;
        G.ents.push(makeEnt(nx, e[1], e[2] === 'gun' ? 'ash' : e[2], e[3], e[4]));
      }
    }
    G.pickups = [];
    if (!attract) {
      for (i = 0; i < spec.loot.length; i++) {
        const u = spec.loot[i];
        G.pickups.push({ x: u[0], y: u[1] - 18, kind: u[2], taken: false });
      }
    }
    G.knives = [];
    G.boss = makeBoss(spec);
    G.gate = spec.w - VW + 48;
    G.checkX = 70;
    G.checkY = GY;
    G.player = makePlayer(70, GY);
    G.camX = 0;
    G.camY = 0;
    G.slashT = 0;
    G.slashN = 0;
    G.slashHit = 0;
    G.atkCd = 0;
    G.deadT = 0;
    G.invuln = attract ? 99 : 0.4;
    G.clearT = 0;
    G.lock = 0;
    G.dropT = 0;
    G.dropPlat = null;
    G.jumpBuf = 0;
    if (!attract) {
      particles.length = 0;
      sparks.length = 0;
      rings.length = 0;
      floats.length = 0;
      bloods.length = 0;
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
    return standAt(x, y) && !standAt(x + face * 34, y);
  }

  function pBox() {
    const p = G.player;
    return { x: p.x - p.w * 0.45, y: p.y - p.h, w: p.w * 0.9, h: p.h * 0.92 };
  }

  function slashBox() {
    const p = G.player;
    const range = meleeRange(G.slashN);
    if (p.cling) {
      const face = p.cling;
      return {
        x: face > 0 ? p.x - 8 : p.x - range,
        y: p.y - 18,
        w: range + 10,
        h: 42
      };
    }
    const x0 = p.face > 0 ? p.x : p.x - range;
    const lift = G.slashN >= 2 ? 8 : 0;
    const h = G.slashN >= 2 ? 38 : 32;
    return { x: x0, y: p.y - 30 - lift, w: range, h: h };
  }

  function inSlash(ex, ey, ew, eh) {
    const s = slashBox();
    return overlap(s.x, s.y, s.w, s.h, ex - ew * 0.5, ey - eh, ew, eh);
  }

  function throwKnife(x, y, vx, vy) {
    G.knives.push({
      x: x, y: y, vx: vx, vy: vy || 0,
      spin: 0, life: 1.2
    });
    capArr(G.knives, 28);
  }

  function doSlash(n) {
    const p = G.player;
    G.slashN = n;
    G.slashT = SLASH_T + (n >= 2 ? 0.05 : 0);
    G.slashHit += 1;
    G.atkCd = n >= 2 ? 0.32 : ATK_CD;
    p.pose = 0.16 + n * 0.03;
    audio.slash(n);
    const range = meleeRange(n);
    const face = p.cling ? p.cling : p.face;
    emit(n >= 2 ? 10 : 6, {
      x: p.x + face * (18 + n * 4), y: p.y - (p.cling ? 8 : 16), j: 8,
      vx0: face * 40, vx1: face * (200 + range), vy0: n >= 2 ? -220 : -160, vy1: p.cling ? 80 : 40,
      life: 0.22, r0: 1, r1: 2.4 + n * 0.3, rgb: n >= 2 ? CYN : HOT
    });
    hitStop(n >= 2 ? 0.045 : 0.032);
    if (n >= 2) {
      popSpark(p.x + face * 26, p.y - 16, CYN, 18);
      kick(2.6, 'thump');
      screenFlash(CYN, 0.12);
    }
  }

  function attack() {
    if (!playing() && G.mode !== 'title') return;
    if (G.deadT > 0 || G.lock > 0) return;
    if (G.slashT > 0.04) return;
    if (G.atkCd > 0.1) return;
    if (G.atkCd > 0 && G.slashN > 0 && G.slashN < 2) doSlash(G.slashN + 1);
    else doSlash(1);
  }

  function hurtEnt(e, dmg, src) {
    if (e.dead || e.hp <= 0) return;
    if (src === 'slash' && e.hitN === G.slashHit) return;
    if (src === 'slash') e.hitN = G.slashHit;
    e.hp -= dmg;
    const rgb = e === G.boss ? MAG : GOLD;
    const face = G.player ? G.player.face : 1;
    sprayBlood(e.x, e.y - 14, face, e === G.boss ? 1.4 : 1);
    juice(e.x, e.y - 14, rgb, e === G.boss ? 1.4 : 1.15);
    if (src === 'slash') {
      hitStop(G.slashN >= 2 ? 0.07 : 0.055);
      kick(G.slashN >= 2 ? 3.8 : 3.2, 'hit');
      audio.hit(G.combo);
    } else {
      hitStop(0.05);
      kick(3.6, 'boom');
    }
    if (e.hp <= 0) {
      e.dead = true;
      e.hp = 0;
      bumpCombo();
      const kind = e === G.boss ? 'boss' : e.kind;
      const sc = (SCORE[kind] || 100) * G.mult;
      addScore(sc);
      floatText(e.x, e.y - 28, '+' + sc, GOLD, e === G.boss || G.mult > 1);
      sprayBlood(e.x, e.y - 12, face, 1.6);
      if (e === G.boss) {
        G.clearT = 1.85;
        audio.boss();
        screenFlash(GOLD, 0.45);
        kick(7.2, 'boom');
        toast(e.name + ' 击破', false, true);
      }
    } else if (e === G.boss) {
      floatText(e.x, e.y - 30, String(e.hp), MAG, false);
    }
  }

  function die(why) {
    if (!playing()) {
      if (G.mode === 'title') {
        G.player = makePlayer(70, GY);
        G.camX = 0;
      }
      return;
    }
    if (G.deadT > 0 || G.invuln > 0 || G.lock > 0) return;
    G.why = why;
    G.deadT = DIE_T;
    G.lives -= 1;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    if (G.player) {
      G.player.cling = 0;
      G.player.wall = null;
    }
    audio.death();
    juice(G.player.x, G.player.y - 14, MAG, 1.6);
    sprayBlood(G.player.x, G.player.y - 14, G.player.face, 1.8);
    screenFlash(MAG, 0.5);
    hitStop(0.08);
    kick(7, 'die');
    syncHud();
  }

  function respawn() {
    G.player = makePlayer(G.checkX, G.checkY);
    G.player.face = 1;
    G.deadT = 0;
    G.invuln = INVULN;
    G.slashT = 0;
    G.slashN = 0;
    syncPips();
  }

  function goLose() {
    G.mode = 'lose';
    saveBest();
    const why = G.why === 'fall' ? '坠入深渊了' : G.why === 'shot' ? '中弹了' : '被击中了';
    showOverlay('lose', '命尽', why + ' · ' + G.score + ' 分 · 连击最高 ×' + Math.max(1, G.maxCombo || 1));
    audio.lose();
    syncHud();
  }

  function goWin() {
    addScore(8000);
    saveBest();
    G.mode = 'win';
    if (stageEl) {
      stageEl.classList.remove('win-flash');
      void stageEl.offsetWidth;
      stageEl.classList.add('win-flash');
    }
    const title = isCore() ? '影核得手' : '古舰已破';
    showOverlay('win', title, (isCore() ? '影核里的舰众更密。 ' : '三关杀穿，舰主倒下。 ') + G.score + ' 分');
    audio.win();
    syncHud();
  }

  function nextStage() {
    addScore(SCORE.stage * G.stage);
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    G.stage += 1;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    loadStage(G.stage, false);
    G.invuln = 0.8;
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'core' ? 'core' : 'raid';
    G.mode = 'play';
    G.t = 0;
    G.clock = 0;
    G.lives = LIVES;
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
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast(isCore() ? '影核' : STAGES[0].name, false, !isCore());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.mult = 1;
    loadStage(1, true);
    G.invuln = 99;
    showOverlay('title', '忍影3', '贴墙滑落，再蹬出去。空格近斩，Shift 跳跃。<br />闯过三关，舰主现身。挨打即丢命。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('raid');
    else startGame(G.kind || 'raid');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('raid');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function wallProbe(p, dir) {
    if (!dir) return null;
    const px = p.x + dir * (p.w * 0.5 + 2);
    const yMid = p.y - p.h * 0.45;
    let i, w;
    for (i = 0; i < G.walls.length; i++) {
      w = G.walls[i];
      if (yMid < w.y0 || yMid > w.y1) continue;
      if (Math.abs(px - w.x) < 6) return w;
    }
    return null;
  }

  function tryCling(p) {
    if (p.grounded || p.wallCool > 0) return;
    let dir = 0;
    if (p.vx > 18 || inR()) dir = 1;
    else if (p.vx < -18 || inL()) dir = -1;
    else dir = p.face;
    const w = wallProbe(p, dir);
    if (!w) return;
    const was = p.cling;
    p.cling = dir;
    p.wall = w;
    p.x = w.x - dir * (p.w * 0.5 + 1.5);
    p.vx = 0;
    p.vy = Math.min(p.vy, WALL_SLIDE);
    p.face = dir;
    if (!was && playing()) {
      audio.cling();
      emit(5, {
        x: w.x, y: p.y - 12, j: 6,
        vx0: -dir * 20, vx1: -dir * 90, vy0: -40, vy1: 40,
        life: 0.18, r0: 1, r1: 2, rgb: CYN, g: 80
      });
      popSpark(w.x, p.y - 12, CYN, 10);
      hitStop(0.022);
      syncHud();
    }
  }

  function doWallJump(p) {
    const dir = p.cling;
    p.cling = 0;
    p.wall = null;
    p.wallCool = 0.14;
    p.vy = -JUMP_WALL;
    p.vx = -dir * WALL_KICK_VX;
    p.face = -dir;
    p.grounded = false;
    p.coyote = 0;
    G.jumpBuf = 0;
    p.squash = 0.78;
    if (playing()) {
      audio.wall();
      emit(10, {
        x: p.x + dir * 8, y: p.y - 14, j: 8,
        vx0: -dir * 40, vx1: -dir * 220, vy0: -120, vy1: 40,
        life: 0.26, r0: 1.2, r1: 3, rgb: CYN, g: 140
      });
      popSpark(p.x, p.y - 12, CYN, 14);
      hitStop(0.03);
      kick(2.6, 'wall');
      screenFlash(CYN, 0.16);
    }
    syncHud();
  }

  function demoThink() {
    const p = G.player;
    demo.r = true;
    demo.l = false;
    demo.u = false;
    if (!p) return;
    if (p.cling) demo.u = true;
    else if (p.grounded) {
      if (pitAhead(p.x, p.y, 1) || wallProbe(p, 1) || (G.clock % 2.4) < 0.1) demo.u = true;
    }
    if (G.atkCd <= 0 && (G.clock * 2 | 0) % 3 === 0) attack();
    if (p.x > 720) {
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

    if (inU()) G.jumpBuf = BUFFER;
    else G.jumpBuf -= dt;
    if (G.jumpBuf < 0) G.jumpBuf = 0;
    if (p.wallCool > 0) p.wallCool -= dt;

    if (p.cling) {
      const w = p.wall;
      if (inD() || !w || p.y - 8 > w.y1 || p.y - p.h < w.y0 - 8) {
        p.cling = 0;
        p.wall = null;
        p.wallCool = 0.08;
        syncHud();
      } else {
        p.x = w.x - p.cling * (p.w * 0.5 + 1.5);
        p.vx = 0;
        p.vy = WALL_SLIDE;
        p.y += p.vy * dt;
        p.face = p.cling;
        p.grounded = false;
        if (G.jumpBuf > 0) doWallJump(p);
        if (p.cling) {
          const plat = landOn(p.x, p.y - 4, p.y + 2, null);
          if (plat) {
            p.y = plat.y;
            p.vy = 0;
            p.grounded = true;
            p.cling = 0;
            p.wall = null;
            syncHud();
          }
        }
      }
    }

    if (!p.cling) {
      let ax = 0;
      if (inL()) ax -= 1;
      if (inR()) ax += 1;
      if (ax) p.face = ax;
      const spd = WALK * (p.grounded ? 1 : AIR);
      if (p.grounded) p.vx = ax * spd;
      else if (ax && p.wallCool <= 0) p.vx = ax * spd;
      p.x += p.vx * dt;
      p.x = clamp(p.x, 16, G.levelW - 16);
      if (G.boss && G.boss.active && !G.boss.dead) {
        const minX = G.levelW - VW + 18;
        if (p.x < minX) p.x = minX;
      }

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
        p.squash = 0.78;
        if (ax) {
          p.face = ax;
          p.vx = ax * WALK;
        }
        audio.hop();
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
          if (p.vy > 220) {
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

      if (!p.grounded) tryCling(p);
    }

    if (p.y > VH + 90) die('fall');

    if (playing() && p.grounded && p.x > G.checkX + 48 && standAt(p.x, p.y)) {
      G.checkX = p.x;
      G.checkY = p.y;
    }

    if (playing() && G.boss && !G.boss.active && !G.boss.dead && p.x > G.gate) {
      G.boss.active = true;
      toast(G.boss.name + ' 现身', false, true);
      audio.boss();
      screenFlash(HOT, 0.32);
      kick(4.2, 'boom');
      syncHud();
    }

    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
    if (!p.cling && ((inL() || inR()) && p.grounded)) p.run += dt * 9;
    else p.run += dt * 2;
    if (p.pose > 0) p.pose -= dt;

    let i;
    if (G.slashT > 0 && G.slashT > 0.04) {
      let e;
      for (i = 0; i < G.ents.length; i++) {
        e = G.ents[i];
        if (e.dead) continue;
        if (inSlash(e.x, e.y, e.w, e.h)) hurtEnt(e, 1, 'slash');
      }
      if (G.boss && !G.boss.dead && G.boss.active && inSlash(G.boss.x, G.boss.y, G.boss.w, G.boss.h)) {
        hurtEnt(G.boss, 1, 'slash');
      }
      for (i = G.knives.length - 1; i >= 0; i--) {
        const s = G.knives[i];
        if (inSlash(s.x, s.y + 8, 10, 10)) {
          s.life = 0;
          popSpark(s.x, s.y, CYN, 10);
          audio.ping(1);
        }
      }
    }

    for (i = 0; i < G.pickups.length; i++) {
      const u = G.pickups[i];
      if (u.taken) continue;
      if (hypot(p.x - u.x, p.y - 16 - u.y) < 22) {
        u.taken = true;
        bumpCombo();
        addScore(SCORE.jade * G.mult);
        juice(u.x, u.y, CRIM, 0.95);
        sprayBlood(u.x, u.y, p.face, 0.7);
        toast('血玉', false, true);
        audio.pickup();
        syncHud();
      }
    }
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    const mul = spdMul(isCore(), G.stage);
    const p = G.player;
    e.t += dt;

    if (e.kind === 'bat') {
      e.x += e.face * 78 * mul * dt;
      if (e.x < e.a || e.x > e.b) e.face = -e.face;
      e.x = clamp(e.x, e.a, e.b);
      e.y = e.flyY + Math.sin(e.t * 2.6) * 26;
      e.grounded = false;
    } else if (e.kind === 'claw') {
      e.y += e.climb * 46 * mul * dt;
      if (e.y < e.a + 10) { e.y = e.a + 10; e.climb = 1; }
      if (e.y > e.b - 8) { e.y = e.b - 8; e.climb = -1; }
      e.grounded = false;
      e.face = p && p.x > e.x ? 1 : -1;
    } else {
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

      if (e.kind === 'ash' || e.kind === 'gun') {
        const spd = (e.kind === 'gun' ? 44 : 66) * mul;
        const nx = e.x + e.face * spd * dt;
        if (nx < e.a || nx > e.b || !standAt(nx + e.face * 8, e.y)) {
          e.face = -e.face;
        } else {
          e.x = nx;
        }
      }

      if (e.kind === 'clone') {
        if (e.grounded && Math.abs(p.x - e.x) < 220 && Math.abs(p.y - e.y) < 100 && e.t > 0.42) {
          e.face = p.x > e.x ? 1 : -1;
          e.vx = e.face * 156 * mul;
          e.vy = -390;
          e.grounded = false;
          e.t = 0;
        }
        if (!e.grounded) e.x += e.vx * dt;
        else {
          const spd = 80 * mul;
          const dir = Math.abs(p.x - e.x) < 240 ? (p.x > e.x ? 1 : -1) : e.face;
          const nx = e.x + dir * spd * dt;
          if (nx < e.a || nx > e.b || !standAt(nx + dir * 8, e.y)) e.face = -e.face;
          else { e.x = nx; e.face = dir; }
        }
        e.x = clamp(e.x, 20, G.levelW - 20);
      }
    }

    if (e.kind === 'gun') {
      e.fire -= dt;
      const dy = Math.abs(p.y - e.y);
      const dx = p.x - e.x;
      if (e.fire <= 0 && dy < 46 && Math.abs(dx) < 340 && playing() && G.deadT <= 0) {
        e.face = dx > 0 ? 1 : -1;
        throwKnife(e.x + e.face * 12, e.y - 16, e.face * KNIFE_SPD * (isCore() ? 1.16 : 1), 0);
        e.fire = (isCore() ? 0.88 : 1.32) / (1 + (G.stage - 1) * 0.08);
        audio.beep(640, 0.04, 'square', 0.02, 280);
      }
    }

    if (playing() && G.deadT <= 0 && G.invuln <= 0) {
      const pb = pBox();
      const slashing = G.slashT > 0.05 && inSlash(e.x, e.y, e.w, e.h);
      if (!slashing && overlap(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) {
        die('hit');
      }
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    if (!b.active) return;
    const p = G.player;
    const mul = spdMul(isCore(), G.stage);
    b.t += dt;
    b.fire -= dt;
    b.spawn -= dt;
    if (!b.grounded) {
      b.vy += GRAV * dt;
      const y0 = b.y;
      const y1 = b.y + b.vy * dt;
      const plat = landOn(b.x, y0, y1, null);
      if (plat && b.vy >= 0) {
        b.y = plat.y;
        b.vy = 0;
        b.grounded = true;
      } else b.y = y1;
    }
    const dx = p.x - b.x;
    b.face = dx > 0 ? 1 : -1;
    const dist = Math.abs(dx);
    if (b.grounded) {
      if (dist > 76) b.x += b.face * 74 * mul * dt;
      else if (dist < 44 && b.t > 0.5) {
        b.vy = -370;
        b.vx = -b.face * 128;
        b.grounded = false;
        b.t = 0;
      }
    } else b.x += (b.vx || 0) * dt;
    b.x = clamp(b.x, G.levelW - VW + 40, G.levelW - 40);

    const low = b.hp < b.max * 0.5;
    const rate = (low ? 0.68 : 1.02) / mul;
    if (b.fire <= 0 && playing() && G.deadT <= 0) {
      throwKnife(b.x + b.face * 16, b.y - 22, b.face * 286, 0);
      if (G.stage >= 2 || low) {
        throwKnife(b.x + b.face * 12, b.y - 28, b.face * 256, -48);
      }
      if (G.stage >= 3) {
        throwKnife(b.x + b.face * 10, b.y - 14, b.face * 240, 36);
        if (low) throwKnife(b.x - b.face * 10, b.y - 18, -b.face * 220, 0);
      }
      b.fire = rate;
      audio.beep(220, 0.08, 'sawtooth', 0.03, 80);
    }

    if (G.stage >= 3 && b.t > 2.4 && b.grounded) {
      juice(b.x, b.y - 16, PUR, 0.8);
      sprayBlood(b.x, b.y - 16, b.face, 0.6);
      b.x = clamp(p.x - b.face * 96, G.levelW - VW + 50, G.levelW - 50);
      b.t = 0;
      popSpark(b.x, b.y - 16, PUR, 22);
    }

    if (G.stage >= 2 && b.spawn <= 0 && playing()) {
      let n = 0;
      const kind = G.stage >= 3 ? 'clone' : 'ash';
      for (let i = 0; i < G.ents.length; i++) if (!G.ents[i].dead && G.ents[i].kind === kind) n++;
      if (n < 2) {
        const sx0 = clamp(b.x - b.face * 70, G.levelW - VW + 60, G.levelW - 60);
        if (standAt(sx0, GY)) {
          G.ents.push(makeEnt(sx0, GY, kind, G.levelW - VW + 30, G.levelW - 30));
          popSpark(sx0, GY - 16, MAG, 16);
        }
      }
      b.spawn = low ? 3.1 : 4.4;
    }

    if (playing() && G.deadT <= 0 && G.invuln <= 0) {
      const pb = pBox();
      const slashing = G.slashT > 0.05 && inSlash(b.x, b.y, b.w, b.h);
      if (!slashing && overlap(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.5, b.y - b.h, b.w, b.h)) {
        die('hit');
      }
    }
  }

  function updateKnives(dt) {
    const p = G.player;
    for (let i = G.knives.length - 1; i >= 0; i--) {
      const s = G.knives[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += (s.vy || 0) * dt;
      s.spin += dt * 14;
      if (s.life <= 0 || s.x < G.camX - 40 || s.x > G.camX + VW + 40) {
        G.knives.splice(i, 1);
        continue;
      }
      if (playing() && G.deadT <= 0) {
        if (G.invuln <= 0 && hypot(s.x - p.x, s.y - (p.y - 16)) < 12) {
          G.knives.splice(i, 1);
          die('shot');
        }
      }
    }
  }

  function updateFx(dt) {
    G.toastT = Math.max(0, G.toastT - dt);
    if (G.slashT > 0) G.slashT -= dt;
    if (G.atkCd > 0) G.atkCd -= dt;
    if (G.atkCd <= 0) G.slashN = 0;
    if (G.invuln > 0 && G.mode !== 'title') G.invuln -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
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
    for (i = bloods.length - 1; i >= 0; i--) {
      o = bloods[i];
      o.life -= dt;
      o.vy += o.g * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.vx *= 0.96;
      if (o.life <= 0) bloods.splice(i, 1);
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

    const cap = REDUCE ? 18 : (isCore() ? 56 : 40);
    if (embers.length < cap) {
      embers.push({
        x: G.camX + rand(-40, VW + 40),
        y: G.camY + rand(-10, VH),
        r: rand(1.1, 2.4),
        v: rand(18, 42),
        drift: rand(-18, 18)
      });
    }
    for (i = embers.length - 1; i >= 0; i--) {
      o = embers[i];
      o.y -= o.v * dt;
      o.x += o.drift * dt;
      if (o.y < G.camY - 12) {
        o.y = G.camY + VH + 8;
        o.x = G.camX + rand(-40, VW + 40);
      }
    }
    if (embers.length > cap) embers.splice(0, embers.length - cap);
  }

  function updateCam(dt) {
    const p = G.player;
    let tx = p.x - VW * 0.38;
    if (G.boss && G.boss.active && !G.boss.dead && p.x > G.levelW - VW) {
      tx = G.levelW - VW;
    }
    tx = clamp(tx, 0, Math.max(0, G.levelW - VW));
    let ty = p.y - VH * 0.72;
    ty = clamp(ty, -80, 12);
    const k = 1 - Math.pow(0.0008, dt);
    G.camX = lerp(G.camX, tx, k);
    G.camY = lerp(G.camY, ty, k * 0.85);
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
    for (let i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt);
    updateBoss(dt);
    updateKnives(dt);
    updateCam(dt);
  }

  function drawSky() {
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (isCore()) {
      g.addColorStop(0, '#1a0408');
      g.addColorStop(0.45, '#220508');
      g.addColorStop(1, '#160406');
    } else if (G.stage >= 3) {
      g.addColorStop(0, '#0c0812');
      g.addColorStop(0.5, '#14060c');
      g.addColorStop(1, '#120406');
    } else if (G.stage === 2) {
      g.addColorStop(0, '#16040a');
      g.addColorStop(0.5, '#1c060a');
      g.addColorStop(1, '#120406');
    } else {
      g.addColorStop(0, '#180806');
      g.addColorStop(0.5, '#200a08');
      g.addColorStop(1, '#140606');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const mx = sx(G.camX + VW * 0.78);
    const my = sy(G.camY + 52);
    ctx.fillStyle = rgba(isCore() ? CRIM : GOLD, isCore() ? 0.4 : 0.58);
    ctx.beginPath();
    ctx.arc(mx, my, 26 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.3);
    ctx.beginPath();
    ctx.arc(mx, my, 40 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.2);
    ctx.beginPath();
    ctx.arc(mx - 7 * scale, my - 5 * scale, 10 * scale, 0, TAU);
    ctx.fill();
  }

  function drawBuildings() {
    const par = G.camX * 0.26;
    const base = sy(GY + 8);
    let i, x, h, w, hue;
    if (G.stage >= 3) {
      for (i = -2; i < 16; i++) {
        x = sx((Math.floor((G.camX + par) / 96) + i) * 96 - par * 0.5);
        h = (70 + hash2(i + 9) * 50) * scale;
        ctx.fillStyle = '#10060e';
        ctx.fillRect(x, base - h, 70 * scale, h + 40 * scale);
        ctx.strokeStyle = rgba(CYN, 0.18);
        ctx.lineWidth = 1.4 * scale;
        ctx.beginPath();
        ctx.arc(x + 22 * scale, base - h + 22 * scale, 8 * scale, 0, TAU);
        ctx.stroke();
        ctx.fillStyle = rgba(HOT, 0.22 + Math.sin(G.clock * 2 + i) * 0.08);
        ctx.fillRect(x + 40 * scale, base - h + 12 * scale, 6 * scale, 10 * scale);
      }
    } else if (G.stage === 2) {
      for (i = -2; i < 14; i++) {
        x = sx((Math.floor((G.camX + par) / 110) + i) * 110 - par * 0.4);
        h = (50 + hash2(i + 4) * 70) * scale;
        ctx.fillStyle = '#16060a';
        ctx.fillRect(x, base - h, 48 * scale, h + 30 * scale);
        ctx.fillStyle = rgba(MAG, 0.22);
        ctx.fillRect(x + 16 * scale, base - h - 18 * scale, 10 * scale, 22 * scale);
        ctx.fillStyle = rgba(CRIM, 0.35);
        ctx.beginPath();
        ctx.ellipse(x + 21 * scale, base - h - 22 * scale, 8 * scale, 10 * scale, 0, 0, TAU);
        ctx.fill();
      }
    }
    for (i = -2; i < 22; i++) {
      x = sx((Math.floor((G.camX + par) / 70) + i) * 70 - par);
      h = (38 + hash2(i + 19 + G.stage * 7) * 90) * scale;
      w = (36 + hash2(i + 3) * 28) * scale;
      ctx.fillStyle = i % 3 === 0 ? '#160606' : '#100406';
      ctx.fillRect(x, base - h, w, h + 40 * scale);
      hue = hash2(i + 11);
      ctx.fillStyle = hue > 0.7 ? rgba(HOT, 0.42) : hue > 0.45 ? rgba(GOLD, 0.26) : rgba(CRIM, 0.18);
      const win = 3 + (hash2(i + 5) * 4 | 0);
      for (let k = 0; k < win; k++) {
        ctx.fillRect(x + 6 * scale, base - h + 8 * scale + k * 10 * scale, 4 * scale, 5 * scale);
        ctx.fillRect(x + 16 * scale, base - h + 8 * scale + k * 10 * scale, 4 * scale, 5 * scale);
      }
    }
  }

  function drawPorthole(x, y) {
    const s = scale;
    const px = sx(x);
    const py = sy(y);
    ctx.strokeStyle = rgba(CYN, 0.45);
    ctx.lineWidth = 1.6 * s;
    ctx.beginPath();
    ctx.arc(px, py - 18 * s, 8 * s, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = rgba(HOT, 0.18 + Math.sin(G.clock * 3 + x) * 0.06);
    ctx.beginPath();
    ctx.arc(px, py - 18 * s, 5.5 * s, 0, TAU);
    ctx.fill();
  }

  function drawTube(x, y) {
    const s = scale;
    const px = sx(x);
    const py = sy(y);
    ctx.fillStyle = rgba(MAG, 0.18);
    ctx.fillRect(px - 4 * s, py - 46 * s, 8 * s, 46 * s);
    ctx.fillStyle = rgba(CRIM, 0.55 + Math.sin(G.clock * 4 + x) * 0.12);
    ctx.beginPath();
    ctx.ellipse(px, py - 50 * s, 9 * s, 12 * s, 0, 0, TAU);
    ctx.fill();
  }

  function drawBanner(x, y) {
    const s = scale;
    const px = sx(x);
    const py = sy(y);
    ctx.strokeStyle = rgba(GOLD, 0.55);
    ctx.lineWidth = 1.6 * s;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px, py - 34 * s);
    ctx.stroke();
    ctx.fillStyle = rgba(HOT, 0.55 + Math.sin(G.clock * 3 + x) * 0.08);
    ctx.beginPath();
    ctx.moveTo(px, py - 34 * s);
    ctx.lineTo(px + 14 * s, py - 26 * s);
    ctx.lineTo(px, py - 18 * s);
    ctx.fill();
  }

  function drawProps() {
    if (G.stage === 2) {
      drawTube(240, GY);
      drawTube(900, GY);
      drawTube(1680, GY);
      drawTube(2280, GY);
      drawBanner(640, GY);
      drawBanner(1480, GY);
    } else if (G.stage >= 3) {
      drawPorthole(180, GY);
      drawPorthole(760, GY);
      drawPorthole(1400, GY);
      drawPorthole(2100, GY);
      drawPorthole(2580, GY);
      drawBanner(420, GY);
      drawBanner(1880, GY);
    } else {
      drawBanner(240, GY);
      drawBanner(860, GY);
      drawBanner(1480, GY);
      drawBanner(1900, GY);
    }
  }

  function drawWalls() {
    const s = scale;
    for (let i = 0; i < G.walls.length; i++) {
      const w = G.walls[i];
      const x = sx(w.x);
      const y0 = sy(w.y0);
      const y1 = sy(w.y1);
      ctx.fillStyle = rgba(CYN, 0.16);
      ctx.fillRect(x - 1.6 * s, y0, 3.2 * s, y1 - y0);
      ctx.fillStyle = rgba(HOT, 0.55);
      ctx.fillRect(x - 0.8 * s, y0, 1.6 * s, y1 - y0);
      const n = Math.max(2, ((w.y1 - w.y0) / 22) | 0);
      for (let k = 0; k <= n; k++) {
        const yy = y0 + (k / n) * (y1 - y0);
        ctx.fillStyle = rgba(CYN, 0.45);
        ctx.fillRect(x - 4 * s, yy, 8 * s, 1.2 * s);
      }
    }
  }

  function drawPlats() {
    for (let i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      const x = sx(p.x);
      const y = sy(p.y);
      const w = p.w * scale;
      const h = p.h * scale;
      ctx.fillStyle = p.base ? '#1a0808' : '#1c0c0a';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = rgba(HOT, p.base ? 0.9 : 0.72);
      ctx.fillRect(x, y, w, 2.4 * scale);
      ctx.fillStyle = rgba(GOLD, 0.3);
      ctx.fillRect(x + 2 * scale, y + 2.4 * scale, w - 4 * scale, 1.2 * scale);
      if (p.base) {
        ctx.fillStyle = rgba(CRIM, 0.14);
        ctx.fillRect(x, y + h - 6 * scale, w, 6 * scale);
        const n = Math.max(2, (p.w / 28) | 0);
        for (let k = 0; k <= n; k++) {
          ctx.fillStyle = k % 2 ? rgba(HOT, 0.28) : rgba(GOLD, 0.22);
          ctx.fillRect(x + (k / n) * w, y, 2 * scale, 4 * scale);
        }
      }
    }
  }

  function drawKnife(s) {
    const x = sx(s.x);
    const y = sy(s.y);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(s.spin);
    ctx.fillStyle = rgba(HOT2, 0.95);
    ctx.beginPath();
    ctx.moveTo(7 * scale, 0);
    ctx.lineTo(-4 * scale, 2.2 * scale);
    ctx.lineTo(-4 * scale, -2.2 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.8);
    ctx.fillRect(-5.4 * scale, -1 * scale, 3 * scale, 2 * scale);
    ctx.restore();
  }

  function drawFigure(x, y, face, t, rgb, size, opt) {
    const s = scale * (size || 1);
    const run = opt.run || 0;
    const sq = opt.squash || 1;
    const pose = opt.pose || 0;
    const slash = opt.slash || 0;
    const blink = opt.blink;
    const cling = opt.cling || 0;
    if (blink && ((G.t * 18) | 0) % 2 === 0) return;
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.scale(face, sq);
    const leg = cling ? 2 * s : Math.sin(run) * 5 * s;
    ctx.strokeStyle = rgba(rgb, 0.95);
    ctx.lineWidth = 2.1 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3 * s, -8 * s);
    ctx.lineTo(-4 * s + (opt.grounded ? -leg : 2 * s), 0);
    ctx.moveTo(3 * s, -8 * s);
    ctx.lineTo(4 * s + (opt.grounded ? leg : -2 * s), 0);
    ctx.stroke();
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.beginPath();
    ctx.moveTo(-7 * s, -10 * s);
    ctx.lineTo(7 * s, -11 * s);
    ctx.lineTo(5 * s, -24 * s);
    ctx.lineTo(-5 * s, -23 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.fillRect(-6 * s, -13 * s, 12 * s, 2 * s);
    const scarf = Math.sin(t * 8) * 3;
    ctx.strokeStyle = rgba(GOLD, 0.85);
    ctx.lineWidth = 1.6 * s;
    ctx.beginPath();
    ctx.moveTo(-2 * s, -20 * s);
    ctx.quadraticCurveTo((-12 - scarf) * s, -16 * s, (-10 - scarf) * s, -8 * s);
    ctx.stroke();
    ctx.fillStyle = '#18080a';
    ctx.beginPath();
    ctx.ellipse(0, -28 * s, 6.2 * s, 6.4 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.fillRect(1 * s, -30 * s, 4.2 * s, 1.6 * s);
    if (opt.boss) {
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = 1.4 * s;
      ctx.strokeRect(-5 * s, -32 * s, 10 * s, 5 * s);
      if (opt.ship) {
        ctx.fillStyle = rgba(PUR, 0.85);
        ctx.fillRect(-4 * s, -36 * s, 8 * s, 3 * s);
      }
    }
    if (opt.claw) {
      ctx.strokeStyle = rgba(CYN, 0.9);
      ctx.lineWidth = 1.8 * s;
      ctx.beginPath();
      ctx.moveTo(-6 * s, -18 * s);
      ctx.lineTo(-14 * s, -10 * s);
      ctx.moveTo(6 * s, -18 * s);
      ctx.lineTo(14 * s, -10 * s);
      ctx.stroke();
    }
    if (opt.bat) {
      ctx.strokeStyle = rgba(rgb, 0.9);
      ctx.lineWidth = 1.6 * s;
      const flap = Math.sin(t * 14) * 8;
      ctx.beginPath();
      ctx.moveTo(-2 * s, -22 * s);
      ctx.lineTo((-14) * s, (-22 - flap) * s);
      ctx.moveTo(2 * s, -22 * s);
      ctx.lineTo(14 * s, (-22 + flap) * s);
      ctx.stroke();
    }
    if (cling) {
      ctx.strokeStyle = rgba(CYN, 0.95);
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(6 * s, -18 * s);
      ctx.lineTo(12 * s, -10 * s);
      ctx.moveTo(6 * s, -14 * s);
      ctx.lineTo(11 * s, -6 * s);
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(WHT, 0.85);
    ctx.lineWidth = 1.8 * s;
    const arm = pose > 0 ? 10 * s : (slash > 0 ? 14 * s : 4 * s);
    const armY = pose > 0 ? -22 * s : (slash > 0 ? -18 * s : -16 * s);
    ctx.beginPath();
    ctx.moveTo(2 * s, -18 * s);
    ctx.lineTo(arm, armY);
    ctx.stroke();
    if (slash > 0) {
      const n = opt.slashN || 1;
      ctx.strokeStyle = rgba(n >= 2 ? CYN : HOT, 0.92);
      ctx.lineWidth = (2.4 + n * 0.4) * s;
      ctx.beginPath();
      const a0 = cling ? 0.2 : (n >= 2 ? -1.25 : -0.9);
      const a1 = cling ? 1.6 : (n >= 2 ? 1.05 : 0.7);
      ctx.arc(8 * s, cling ? -8 * s : -16 * s, (16 + n * 3) * s, a0, a1);
      ctx.stroke();
      ctx.strokeStyle = rgba(n >= 2 ? GOLD : WHT, 0.75);
      ctx.lineWidth = 1.2 * s;
      ctx.beginPath();
      ctx.arc(8 * s, cling ? -8 * s : -16 * s, (12 + n) * s, a0 + 0.1, a1 - 0.1);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPickup(u) {
    if (u.taken) return;
    const x = sx(u.x);
    const y = sy(u.y + Math.sin(G.clock * 4) * 3);
    const s = scale;
    ctx.fillStyle = rgba(CRIM, 0.22);
    ctx.beginPath();
    ctx.arc(x, y, 10 * s, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(G.clock * 2.4);
    ctx.fillStyle = rgba(BLOOD, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, 7 * s);
    ctx.bezierCurveTo(7 * s, 2 * s, 5 * s, -6 * s, 0, -7 * s);
    ctx.bezierCurveTo(-5 * s, -6 * s, -7 * s, 2 * s, 0, 7 * s);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.beginPath();
    ctx.arc(-1.4 * s, -1.6 * s, 1.6 * s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawGate() {
    if (G.boss && G.boss.active) return;
    const x = sx(G.gate);
    const y0 = sy(G.camY);
    ctx.fillStyle = rgba(HOT, 0.08 + Math.sin(G.clock * 4) * 0.03);
    ctx.fillRect(x, y0, 6 * scale, VH * scale);
    ctx.fillStyle = rgba(CYN, 0.4);
    ctx.fillRect(x + 2 * scale, y0, 2 * scale, VH * scale);
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
    for (i = 0; i < embers.length; i++) {
      o = embers[i];
      ctx.fillStyle = rgba(i % 3 ? HOT : GOLD, 0.28);
      ctx.fillRect(sx(o.x), sy(o.y), o.r * scale, o.r * scale);
    }
    for (i = 0; i < bloods.length; i++) {
      o = bloods[i];
      a = o.life / o.max;
      ctx.fillStyle = rgba(BLOOD, 0.9 * a);
      ctx.fillRect(sx(o.x), sy(o.y), o.r * scale, (o.r * 1.6) * scale);
    }
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

  function draw() {
    dpr = dpr || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#140506';
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
    drawBuildings();
    drawProps();
    drawPlats();
    drawWalls();
    drawGate();

    let i;
    for (i = 0; i < G.pickups.length; i++) drawPickup(G.pickups[i]);
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      const rgb = e.kind === 'gun' ? HOT2
        : e.kind === 'clone' ? MAG
        : e.kind === 'claw' ? CYN
        : e.kind === 'bat' ? BONE
        : HOT2;
      drawFigure(e.x, e.y, e.face, G.clock, rgb, e.kind === 'clone' ? 0.96 : 0.9, {
        run: G.clock * (e.kind === 'clone' ? 11 : 8),
        grounded: e.grounded, squash: 1, pose: 0,
        slash: 0, boss: false, claw: e.kind === 'claw', bat: e.kind === 'bat'
      });
    }
    if (G.boss && !G.boss.dead) {
      const ba = !G.boss.active ? 0.4 : 1;
      ctx.globalAlpha = ba;
      const brgb = G.stage >= 3 ? PUR : G.stage === 2 ? MAG : CRIM;
      drawFigure(G.boss.x, G.boss.y, G.boss.face, G.clock, brgb, G.stage >= 3 ? 1.38 : 1.26, {
        run: G.clock * 5, grounded: G.boss.grounded, squash: 1,
        pose: G.boss.fire < 0.2 ? 0.12 : 0, slash: 0, boss: true, ship: G.stage >= 3
      });
      ctx.globalAlpha = 1;
    }
    for (i = 0; i < G.knives.length; i++) drawKnife(G.knives[i]);

    const p = G.player;
    if (p) {
      const blink = playing() && G.invuln > 0 && G.deadT <= 0;
      drawFigure(p.x, p.y, p.face, G.clock, HOT, 1, {
        run: p.run, grounded: p.grounded, squash: p.squash,
        pose: p.pose, slash: G.slashT, slashN: G.slashN, blink: blink,
        cling: p.cling, boss: false
      });
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
    const slashK = k === 'z' || k === 'Z';
    const jumpK = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.up = down;
    if (jumpK) keys.jump = down;
    keys.u = keys.up || keys.jump;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;

    if (down && (isMove || space || slashK || jumpK || k === 'Enter')) e.preventDefault();
    if (!down) return;
    if (e.repeat && (space || slashK)) return;

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
      startGame('raid');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('core');
      return;
    }
    if (slashK || space || k === 'Enter') {
      if (overlayOpen()) {
        if (slashK) return;
        primaryAction();
        return;
      }
      if (playing() && (space || slashK)) attack();
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
    hold(document.getElementById('btn-jump'), function () {
      keys.jump = true;
      keys.u = true;
    }, function () {
      keys.jump = false;
      keys.u = keys.up || keys.jump;
    });
    hold(document.getElementById('btn-slash'), function () {
      if (playing()) attack();
    }, null);
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen()) return;
      if (playing()) attack();
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

  if (btnRaid) {
    btnRaid.addEventListener('click', function () {
      audio.ensure();
      startGame('raid');
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
      if (G.mode === 'win' && !isCore()) startGame('core');
      else goTitle();
    });
  }
  if (modeRaid) {
    modeRaid.addEventListener('click', function () {
      audio.ensure();
      startGame('raid');
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
      keys.up = false;
      keys.jump = false;
    }
  });

  requestAnimationFrame(frame);
})();
