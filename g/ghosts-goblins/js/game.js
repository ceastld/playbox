'use strict';

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
  const WALK = 200;
  const AIR = 0.9;
  const JUMP_V = 490;
  const GRAV = 1420;
  const MAX_FALL = 560;
  const COYOTE = 0.08;
  const BUFFER = 0.12;
  const PW = 14;
  const PH = 26;
  const INVULN = 1.4;
  const INVULN_TIDE = 1.05;
  const DIE_T = 0.8;
  const BEST_KEY = 'playbox-ghosts-goblins-best';
  const MUTE_KEY = 'playbox-ghosts-goblins-mute';
  const OPS = '方向键 / WASD 走 · ↑ 跳 · 空格丢枪 · R 重开 · M 静音';

  const MAG = [255, 61, 104];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 46, 10];
  const HOT2 = [255, 106, 58];
  const WHT = [246, 238, 232];
  const STEEL = [200, 208, 220];
  const SKIN = [232, 184, 152];
  const RED = [255, 42, 58];
  const ORG = [255, 154, 58];
  const LEAF = [61, 255, 122];
  const MOSS = [40, 88, 52];
  const CRIM = [180, 24, 28];

  const WPN_NAME = { lance: '长枪', dagger: '短匕', fire: '火焰' };
  const WEAPONS = {
    lance: { name: '长枪', cd: 0.2, max: 2, spd: 410, dmg: 1, grav: 0, pool: 0, life: 0.84, rgb: GOLD, w: 14, h: 4 },
    dagger: { name: '短匕', cd: 0.1, max: 3, spd: 580, dmg: 1, grav: 0, pool: 0, life: 0.58, rgb: CYN, w: 10, h: 3 },
    fire: { name: '火焰', cd: 0.28, max: 2, spd: 246, dmg: 2, grav: 780, pool: 1, life: 1.65, rgb: ORG, w: 10, h: 8 }
  };

  const SCORE = {
    zombie: 100, hop: 150, plant: 200, arremer: 500,
    boss: 4000, stage: 2000, gate: 1200
  };

  const STAGES = [
    {
      name: '荒林', boss: '赤魔', w: 2240, hp: 24, gate: 8, theme: 'wood',
      ground: [[0, 520], [600, 320], [1000, 360], [1440, 800]],
      plats: [
        [180, MY, 150], [420, MY, 150], [680, MY, 160],
        [1080, MY, 160], [1480, MY, 150], [1900, MY, 150],
        [260, HY, 120], [820, HY, 130], [1320, HY, 130], [1860, HY, 130]
      ],
      ents: [
        [240, GY, 'zombie', 20, 500],
        [380, GY, 'zombie', 40, 510],
        [480, GY, 'plant', 0, 0],
        [240, MY, 'hop', 180, 320],
        [720, GY, 'zombie', 610, 900],
        [880, GY, 'plant', 0, 0],
        [750, MY, 'hop', 680, 830],
        [880, HY, 'arremer', 820, 1040],
        [1160, GY, 'zombie', 1010, 1340],
        [1320, GY, 'plant', 0, 0],
        [1160, MY, 'hop', 1080, 1230],
        [1640, GY, 'zombie', 1450, 2100],
        [1800, GY, 'plant', 0, 0],
        [1560, MY, 'zombie', 1480, 1620],
        [1920, HY, 'arremer', 1860, 2100]
      ],
      drops: [[420, MY, 'dagger'], [1080, MY, 'armor'], [1860, HY, 'fire']]
    },
    {
      name: '断崖', boss: '焰魔', w: 2560, hp: 34, gate: 11, theme: 'cliff',
      ground: [[0, 440], [524, 260], [868, 280], [1232, 320], [1636, 924]],
      plats: [
        [120, MY, 150], [360, MY, 150], [600, MY, 160],
        [960, MY, 160], [1320, MY, 160], [1680, MY, 170], [2140, MY, 150],
        [220, HY, 120], [700, HY, 140], [1180, HY, 140],
        [1640, HY, 150], [2100, HY, 140]
      ],
      ents: [
        [180, GY, 'zombie', 20, 420],
        [360, GY, 'plant', 0, 0],
        [180, MY, 'hop', 120, 260],
        [280, HY, 'arremer', 220, 500],
        [620, GY, 'zombie', 530, 770],
        [760, GY, 'plant', 0, 0],
        [680, MY, 'hop', 600, 750],
        [980, GY, 'zombie', 880, 1130],
        [1120, GY, 'plant', 0, 0],
        [1040, MY, 'hop', 960, 1110],
        [1260, HY, 'arremer', 1180, 1460],
        [1360, GY, 'zombie', 1240, 1540],
        [1520, GY, 'plant', 0, 0],
        [1760, MY, 'hop', 1680, 1840],
        [1800, GY, 'zombie', 1650, 2400],
        [2000, GY, 'plant', 0, 0],
        [2200, MY, 'arremer', 2140, 2280],
        [2180, HY, 'hop', 2100, 2230]
      ],
      drops: [[600, MY, 'fire'], [1180, HY, 'armor'], [1680, MY, 'dagger'], [2100, HY, 'fire']]
    },
    {
      name: '魔门', boss: '门卫', w: 2840, hp: 44, gate: 16, theme: 'gate',
      ground: [[0, 400], [484, 260], [828, 300], [1212, 280], [1576, 340], [2000, 840]],
      plats: [
        [80, MY, 140], [300, MY, 150], [580, MY, 160],
        [960, MY, 160], [1340, MY, 150], [1720, MY, 170],
        [2100, MY, 160], [2500, MY, 150],
        [180, HY, 120], [640, HY, 140], [1100, HY, 140],
        [1560, HY, 150], [2040, HY, 140], [2480, HY, 140]
      ],
      ents: [
        [160, GY, 'zombie', 20, 380],
        [320, GY, 'plant', 0, 0],
        [160, MY, 'hop', 80, 210],
        [240, HY, 'arremer', 180, 420],
        [600, GY, 'zombie', 490, 760],
        [760, GY, 'plant', 0, 0],
        [660, MY, 'hop', 580, 730],
        [720, HY, 'arremer', 640, 900],
        [960, GY, 'zombie', 840, 1110],
        [1080, GY, 'plant', 0, 0],
        [1040, MY, 'hop', 960, 1110],
        [1180, HY, 'arremer', 1100, 1380],
        [1360, GY, 'zombie', 1220, 1480],
        [1480, GY, 'plant', 0, 0],
        [1800, MY, 'hop', 1720, 1880],
        [1720, GY, 'zombie', 1580, 1900],
        [1880, GY, 'plant', 0, 0],
        [2180, MY, 'arremer', 2100, 2260],
        [2120, HY, 'hop', 2040, 2170],
        [2200, GY, 'zombie', 2010, 2700],
        [2480, GY, 'plant', 0, 0],
        [2580, MY, 'arremer', 2500, 2640]
      ],
      drops: [[300, MY, 'dagger'], [1100, HY, 'armor'], [1720, MY, 'fire'], [2480, HY, 'dagger']]
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

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    const h = jumpHeight();
    if (h < 74 || h > 96) throw new Error('jump height ' + h);
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('tide faster');
    if (spdMul(false, 2) <= spdMul(false, 1)) throw new Error('later faster');
    if (!WEAPONS.lance || !WEAPONS.dagger || !WEAPONS.fire) throw new Error('weapons');
    if (WEAPONS.axe) throw new Error('no axe');
    if (WEAPONS.dagger.cd >= WEAPONS.lance.cd) throw new Error('dagger faster');
    if (WEAPONS.dagger.max <= WEAPONS.lance.max) throw new Error('dagger more');
    if (!WEAPONS.fire.pool || !WEAPONS.fire.grav) throw new Error('fire arc pool');
    if (BEST_KEY !== 'playbox-ghosts-goblins-best') throw new Error('best key');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    if (STAGES[0].gate >= STAGES[1].gate || STAGES[1].gate >= STAGES[2].gate) throw new Error('gate hp');
    let i, s, hasZ, hasP, hasA, hasDrop, hasPit, g;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ground.length || !s.ents.length) throw new Error('stage ' + s.name);
      hasZ = false;
      hasP = false;
      hasA = false;
      hasDrop = false;
      hasPit = false;
      s.ents.forEach(function (e) {
        if (e[2] === 'zombie') hasZ = true;
        if (e[2] === 'plant') hasP = true;
        if (e[2] === 'arremer') hasA = true;
      });
      s.drops.forEach(function (d) {
        if (d[2] === 'lance' || d[2] === 'dagger' || d[2] === 'fire') hasDrop = true;
      });
      for (g = 0; g < s.ground.length - 1; g++) {
        if (s.ground[g][0] + s.ground[g][1] < s.ground[g + 1][0] - 20) hasPit = true;
      }
      if (!hasZ || !hasP || !hasA) throw new Error('ents ' + s.name);
      if (!hasDrop) throw new Error('drops ' + s.name);
      if (!hasPit) throw new Error('pits ' + s.name);
      if (!s.gate) throw new Error('gate ' + s.name);
    }
    const air = WALK * AIR * (2 * JUMP_V / GRAV);
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      for (g = 0; g < s.ground.length - 1; g++) {
        const gap = s.ground[g + 1][0] - (s.ground[g][0] + s.ground[g][1]);
        if (gap < 48) throw new Error('pit tiny ' + s.name + ' ' + gap);
        if (gap > air - 16) throw new Error('pit wide ' + s.name + ' ' + gap + '>' + air);
      }
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
  const armorLabel = document.getElementById('armor-label');
  const gunLabel = document.getElementById('gun-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const chainPop = document.getElementById('chain-pop');
  const hintEl = document.getElementById('hint');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
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
  const mist = [];
  const shards = [];
  const leaves = [];
  const keys = { l: false, r: false, u: false, fire: false };
  const demo = { l: false, r: false, u: false, fire: false };

  const G = {
    mode: 'title',
    kind: 'run',
    stage: 1,
    levelW: 2240,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    maxCombo: 0,
    mult: 1,
    weapon: 'lance',
    armor: true,
    player: null,
    plats: [],
    ents: [],
    shots: [],
    pickups: [],
    boss: null,
    gate: null,
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
    fireCd: 0,
    throwT: 0,
    muzzle: 0,
    jumpBuf: 0,
    fireBuf: 0,
    checkX: 70,
    checkY: GY,
    clearT: 0,
    lock: 0,
    nextLife: LIFE_EVERY,
    why: '',
    swapT: 0,
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
  function inL() {
    return G.mode === 'title' ? demo.l : (overlayOpen() ? false : keys.l);
  }
  function inR() {
    return G.mode === 'title' ? demo.r : (overlayOpen() ? false : keys.r);
  }
  function inU() {
    return G.mode === 'title' ? demo.u : (overlayOpen() ? false : keys.u);
  }
  function fireHeld() {
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
      this.beep(250, 0.07, 'square', 0.042, 560);
    },
    land() {
      this.ensure();
      this.noise(0.04, 0.026, 480);
      this.beep(120, 0.05, 'triangle', 0.022, 64);
    },
    throw(kind) {
      this.ensure();
      if (kind === 'dagger') {
        this.beep(1400, 0.038, 'square', 0.042, 920);
        this.beep(1880, 0.05, 'triangle', 0.026, 1100);
      } else if (kind === 'fire') {
        this.noise(0.1, 0.052, 240);
        this.beep(220, 0.13, 'sawtooth', 0.044, 80);
      } else {
        this.beep(680, 0.055, 'square', 0.046, 240);
        this.noise(0.028, 0.024, 1500);
      }
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
    shatter() {
      this.ensure();
      this.noise(0.13, 0.074, 860);
      this.beep(920, 0.06, 'square', 0.052, 200);
      this.beep(320, 0.18, 'sawtooth', 0.05, 72);
      this.beep(150, 0.22, 'triangle', 0.04, 46);
    },
    swap() {
      this.ensure();
      this.beep(523, 0.07, 'square', 0.04, 784);
      this.beep(784, 0.09, 'triangle', 0.042, 1046);
      this.beep(1046, 0.12, 'sine', 0.036, 1318);
    },
    armor() {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.04, 523);
      this.beep(659, 0.12, 'triangle', 0.045, 880);
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
    spawn() {
      this.ensure();
      this.beep(110, 0.1, 'sawtooth', 0.03, 64);
      this.noise(0.06, 0.03, 380);
    },
    gate() {
      this.ensure();
      this.beep(180, 0.14, 'sawtooth', 0.046, 90);
      this.beep(90, 0.22, 'triangle', 0.04, 48);
      this.noise(0.12, 0.05, 280);
    },
    snap() {
      this.ensure();
      this.noise(0.05, 0.04, 700);
      this.beep(420, 0.06, 'square', 0.034, 160);
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
    const t = isTide();
    if (modeRun) modeRun.setAttribute('aria-pressed', t ? 'false' : 'true');
    if (modeTide) modeTide.setAttribute('aria-pressed', t ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      stageLabel.textContent = (isTide() ? '魔潮 ' : '') + spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active) || (G.gate && G.gate.open));
    }
    if (tagLabel) {
      tagLabel.textContent = isTide() ? '魔潮' : '闯关';
      tagLabel.classList.toggle('warn', isTide());
      tagLabel.classList.toggle('hot', !isTide() && G.stage >= 3);
    }
    if (gunLabel) {
      gunLabel.textContent = WPN_NAME[G.weapon] || '长枪';
      gunLabel.className = 'gun'
        + (G.weapon === 'dagger' ? ' dagger' : '')
        + (G.weapon === 'fire' ? ' fire' : '');
    }
    if (armorLabel) {
      armorLabel.textContent = G.armor ? '铠甲' : '内裤';
      armorLabel.classList.toggle('bare', !G.armor);
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 铠甲碎了还能打，再挨一下丢命', 'warn');
    else if (G.mode === 'win') setHint('魔门已破 · R 再来一局', 'hot');
    else if (G.gate && G.gate.open && G.gate.hp > 0) setHint('砸开魔门 · 空格连投', 'hot');
    else if (!G.armor) setHint('内裤 · 再挨一下丢命 · 空格丢枪', 'warn');
    else if (G.lives === 1) setHint('最后一命 · 跳过深坑 · 空格丢枪', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('头目 · ' + spec.boss, 'hot');
    else setHint('向右走 · 空格丢枪 · 跳过深坑 · 铠甲碎了还能打', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'GHOST';
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
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag, cls) {
    if (REDUCE || G.mode === 'title') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.007));
    if (!stageEl) return;
    const c = cls || (mag >= 6 ? 'die' : mag >= 3.4 ? 'boom' : 'hit');
    kickTok += 1;
    stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'pickup', 'win-flash', 'shatter', 'throw');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'pickup', 'win-flash', 'shatter', 'throw');
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
      squash: 1, run: 0
    };
  }

  function makePlat(x, y, w, base) {
    return { x: x, y: y, w: w, h: base ? 48 : 12, base: !!base };
  }

  function hpOf(kind) {
    if (kind === 'plant') return 3;
    if (kind === 'arremer') return 5;
    if (kind === 'hop') return 2;
    return 1;
  }

  function makeEnt(x, y, kind, a, b) {
    const hp = hpOf(kind);
    const fly = kind === 'arremer';
    return {
      id: uid++,
      x: x, y: y, vx: 0, vy: 0, face: -1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b,
      t: rand(0, 2), fire: rand(0.5, 1.6),
      snap: rand(0.2, 0.8),
      hopT: rand(0.3, 0.9),
      grounded: !fly,
      dead: false, hitN: 0,
      homeY: y, homeX: x,
      emerge: kind === 'zombie' ? 0.01 : 0,
      buried: kind === 'zombie',
      state: 'idle',
      w: kind === 'plant' ? 18 : kind === 'arremer' ? 20 : kind === 'hop' ? 14 : 13,
      h: kind === 'plant' ? 22 : kind === 'arremer' ? 18 : kind === 'hop' ? 14 : 22
    };
  }

  function makeBoss(spec) {
    const hp = (spec.hp * (isTide() ? 1.2 : 1)) | 0;
    return {
      id: uid++,
      x: spec.w - 168, y: HY + 18, vx: 0, vy: 0, face: -1,
      hp: hp, max: hp, kind: spec.boss,
      t: 0, fire: 1.1, state: 'wait',
      grounded: false, dead: false, active: false,
      hitN: 0, w: 36, h: 32, name: spec.boss,
      homeY: HY + 18, warp: 0
    };
  }

  function makeGate(spec) {
    const hp = (spec.gate * (isTide() ? 1.2 : 1)) | 0;
    return {
      x: spec.w - 78,
      y: GY,
      hp: hp,
      max: hp,
      open: false,
      dead: false,
      hitN: 0,
      t: 0,
      w: 36,
      h: 78
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
    G.ents = [];
    for (i = 0; i < spec.ents.length; i++) {
      const e = spec.ents[i];
      G.ents.push(makeEnt(e[0], e[1], e[2], e[3], e[4]));
    }
    if (isTide() && !attract) {
      for (i = 0; i < spec.ents.length; i++) {
        if (i % 2 !== 0) continue;
        const e = spec.ents[i];
        if (e[2] === 'arremer' || e[2] === 'plant') continue;
        G.ents.push(makeEnt(e[0] - 28, e[1], e[2], e[3], e[4]));
      }
    }
    G.pickups = [];
    if (!attract) {
      for (i = 0; i < spec.drops.length; i++) {
        const d = spec.drops[i];
        G.pickups.push({ x: d[0], y: d[1] - 18, kind: d[2], taken: false, t: rand(0, 3) });
      }
    }
    G.shots = [];
    G.boss = makeBoss(spec);
    G.gate = makeGate(spec);
    G.checkX = 70;
    G.checkY = GY;
    G.player = makePlayer(70, GY);
    G.camX = 0;
    G.camY = 0;
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = attract ? 99 : 0.45;
    G.clearT = 0;
    G.lock = 0;
    G.jumpBuf = 0;
    G.fireBuf = 0;
    G.muzzle = 0;
    G.throwT = 0;
    G.swapT = 0;
    seedMist();
    if (!attract) {
      particles.length = 0;
      sparks.length = 0;
      rings.length = 0;
      floats.length = 0;
      shards.length = 0;
    }
    syncHud();
  }

  function platUnder(x, fy) {
    let best = null;
    for (let i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      if (x < p.x + 3 || x > p.x + p.w - 3) continue;
      if (fy >= p.y - 3 && fy <= p.y + 8) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }

  function landOn(x, y0, y1) {
    let best = null;
    for (let i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      if (x < p.x + 4 || x > p.x + p.w - 4) continue;
      if (y0 <= p.y + 2 && y1 >= p.y) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }

  function standAt(x, y) {
    return !!platUnder(x, y);
  }

  function pitAhead(x, y, face) {
    return standAt(x, y) && !standAt(x + face * 30, y);
  }

  function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function pBox() {
    const p = G.player;
    return { x: p.x - p.w * 0.4, y: p.y - p.h, w: p.w * 0.8, h: p.h * 0.9 };
  }

  function eBox(e) {
    return { x: e.x - e.w * 0.5, y: e.y - e.h, w: e.w, h: e.h };
  }

  function onScreen(x, pad) {
    const m = pad == null ? 40 : pad;
    return x > G.camX - m && x < G.camX + VW + m;
  }

  function countMine() {
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (s.from === 'p' && s.life > 0 && !s.pool) n += 1;
    }
    return n;
  }

  function spawnShot(x, y, vx, vy, spec, from, kind) {
    G.shots.push({
      x: x, y: y, vx: vx, vy: vy,
      w: spec.w || 10, h: spec.h || 4,
      dmg: spec.dmg || 1, pierce: spec.pierce || 0,
      life: spec.life || 0.8, max: spec.life || 0.8,
      grav: spec.grav || 0, pool: false, wantPool: !!spec.pool,
      from: from, kind: kind, rgb: spec.rgb || GOLD,
      rot: 0, hit: {}
    });
  }

  function tryThrow() {
    if (G.deadT > 0 || G.lock > 0) return;
    if (G.fireCd > 0) return;
    const spec = WEAPONS[G.weapon] || WEAPONS.lance;
    if (countMine() >= spec.max) return;
    G.fireBuf = 0;
    const p = G.player;
    const oxp = p.x + p.face * 12;
    const oyp = p.y - 16;
    let vx = p.face * spec.spd;
    let vy = spec.grav ? -240 : 0;
    if (spec.grav && inU() && !p.grounded) vy = -330;
    spawnShot(oxp, oyp, vx, vy, spec, 'p', G.weapon);
    G.fireCd = spec.cd;
    G.throwT = 0.14;
    G.muzzle = 0.09;
    if (playing()) {
      audio.throw(G.weapon);
      hitStop(0.034);
      kick(1.4, 'throw');
      emit(5, {
        x: oxp, y: oyp, j: 4,
        vx0: vx * 0.1, vx1: vx * 0.22, vy0: -50, vy1: 24,
        life: 0.16, r0: 1, r1: 2.4, rgb: spec.rgb
      });
    }
  }

  function enemyShot(x, y, vx, vy, dmg) {
    G.shots.push({
      x: x, y: y, vx: vx, vy: vy,
      w: 7, h: 7, dmg: dmg || 1, pierce: 0,
      life: 1.55, max: 1.55, grav: 0, pool: false, wantPool: false,
      from: 'e', kind: 'ball', rgb: ORG, rot: 0, hit: {}
    });
  }

  function killEnt(e) {
    if (e.dead) return;
    e.dead = true;
    e.hp = 0;
    const pts = (SCORE[e.kind] || 100) * G.mult;
    if (playing()) {
      bumpCombo();
      addScore(pts);
      floatText(e.x, e.y - e.h - 6, '+' + pts, GOLD, G.mult >= 2);
      juice(e.x, e.y - e.h * 0.5, e.kind === 'arremer' ? RED : (e.kind === 'plant' ? LEAF : HOT), e.kind === 'arremer' ? 1.5 : 0.95);
      audio.hit(G.combo);
      hitStop(e.kind === 'arremer' ? 0.068 : 0.046);
    }
  }

  function hurtEnt(e, dmg, sx0, sy0) {
    if (e.dead || e.buried || e.emerge > 0.12) return false;
    e.hp -= dmg;
    e.hitN = 0.12;
    if (e.hp <= 0) {
      killEnt(e);
      return true;
    }
    emit(4, {
      x: sx0, y: sy0, j: 4,
      vx0: -80, vx1: 80, vy0: -120, vy1: -10,
      life: 0.18, r0: 1, r1: 2, rgb: WHT
    });
    return true;
  }

  function takePickup(u) {
    if (u.taken) return;
    u.taken = true;
    if (u.kind === 'armor') {
      G.armor = true;
      audio.armor();
      toast('铠甲', false, true);
      floatText(u.x, u.y, '铠甲', STEEL, true);
      juice(u.x, u.y, STEEL, 1.1);
      if (armorLabel) {
        armorLabel.classList.remove('flash');
        void armorLabel.offsetWidth;
        armorLabel.classList.add('flash');
      }
    } else {
      G.weapon = u.kind;
      G.swapT = 0.4;
      audio.swap();
      toast(WPN_NAME[u.kind] || '武器', false, true);
      floatText(u.x, u.y, WPN_NAME[u.kind], WEAPONS[u.kind] ? WEAPONS[u.kind].rgb : GOLD, true);
      juice(u.x, u.y, WEAPONS[u.kind] ? WEAPONS[u.kind].rgb : GOLD, 1.2);
      kick(3.2, 'pickup');
      screenFlash(GOLD, 0.35);
    }
    hitStop(0.05);
    syncHud();
  }

  function shatterArmor() {
    const p = G.player;
    G.armor = false;
    G.invuln = invulnTime();
    audio.shatter();
    toast('铠甲碎了', true, false);
    floatText(p.x, p.y - 30, '碎', STEEL, true);
    hitStop(0.074);
    kick(6.6, 'shatter');
    screenFlash(STEEL, 0.58);
    popSpark(p.x, p.y - 14, STEEL, 24);
    let i;
    for (i = 0; i < 18; i++) {
      const ang = (i / 18) * TAU + rand(-0.2, 0.2);
      shards.push({
        x: p.x, y: p.y - 14,
        vx: Math.cos(ang) * rand(150, 340),
        vy: Math.sin(ang) * rand(80, 270) - 90,
        rot: rand(0, TAU),
        vr: rand(-9, 9),
        life: rand(0.48, 0.86),
        max: 0.86,
        w: rand(3, 7),
        h: rand(2, 5)
      });
    }
    emit(20, {
      x: p.x, y: p.y - 12, j: 10,
      vx0: -270, vx1: 270, vy0: -340, vy1: -20,
      life: 0.52, r0: 1.4, r1: 3.6, rgb: STEEL
    });
    if (armorLabel) {
      armorLabel.classList.remove('flash');
      void armorLabel.offsetWidth;
      armorLabel.classList.add('flash');
    }
    syncHud();
  }

  function die(why) {
    if (G.deadT > 0 || G.mode !== 'play') return;
    G.why = why || 'hit';
    G.lives -= 1;
    G.deadT = DIE_T;
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    audio.death();
    juice(G.player.x, G.player.y - 12, HOT, 1.65);
    hitStop(0.08);
    kick(7, 'die');
    screenFlash(HOT, 0.48);
    syncHud();
  }

  function hurtPlayer(why) {
    if (!playing() || G.invuln > 0 || G.deadT > 0) return;
    if (G.armor) shatterArmor();
    else die(why || 'hit');
  }

  function respawn() {
    G.player = makePlayer(G.checkX, G.checkY);
    G.armor = true;
    G.invuln = INVULN;
    G.deadT = 0;
    G.fireCd = 0.1;
    toast('重生 · 铠甲', true, false);
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    const why = G.why === 'fall' ? '坠入深渊了' : G.why === 'touch' ? '撞上了' : '被击中了';
    showOverlay('lose', '被击中了', why + '。连击 ×' + G.maxCombo + ' · ' + G.score + ' 分');
    syncHud();
  }

  function goWin() {
    const bonus = isTide() ? 7000 : 9000;
    addScore(bonus);
    G.mode = 'win';
    audio.win();
    kick(4, 'win-flash');
    screenFlash(GOLD, 0.42);
    showOverlay('win', isTide() ? '魔潮平了' : '魔门已破',
      (isTide() ? '魔潮打穿三关。' : '闯关砸开魔门。') + G.score + ' 分 · 连击 ×' + G.maxCombo);
    syncHud();
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    const keepW = G.weapon;
    const keepA = G.armor;
    loadStage(G.stage + 1, false);
    G.weapon = keepW;
    G.armor = keepA;
    G.invuln = 1.1;
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    syncHud();
  }

  function startGame(kind) {
    G.mode = 'play';
    G.kind = kind === 'tide' ? 'tide' : 'run';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.weapon = 'lance';
    G.armor = true;
    G.nextLife = LIFE_EVERY;
    G.why = '';
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    loadStage(1, false);
    G.armor = true;
    hideOverlay();
    audio.start();
    toast(isTide() ? '魔潮 · 更密' : STAGES[0].name, isTide(), !isTide());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'run';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.mult = 1;
    G.weapon = 'lance';
    G.armor = true;
    loadStage(1, true);
    G.invuln = 99;
    showOverlay('title', '魔堡', '铠甲一打即碎，内裤再挨一击丢命。向右冲，跳过深坑，丢长枪、火、匕，砸开魔门。');
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

  function demoThink() {
    const p = G.player;
    demo.r = true;
    demo.l = false;
    demo.fire = ((G.clock * 2.4) | 0) % 2 === 0;
    demo.u = pitAhead(p.x, p.y, 1) && p.grounded;
    if (p.x > G.levelW - 300) {
      G.player = makePlayer(70, GY);
      G.camX = 0;
      G.weapon = 'lance';
      G.armor = true;
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

    if (p.grounded) {
      p.vx = ax * WALK;
    } else if (ax) {
      p.vx = ax * WALK * AIR;
    } else {
      p.vx *= Math.pow(0.22, dt);
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
    const y0 = p.y;
    let y1 = p.y + p.vy * dt;
    p.grounded = false;
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
        if (plat.base && playing()) {
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
    if (ax && p.grounded) p.run += dt * 10;
    else p.run += dt * 2;

    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.throwT > 0) G.throwT -= dt;
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.swapT > 0) G.swapT -= dt;
    if (G.fireBuf > 0) G.fireBuf -= dt;
    if (fireHeld() || G.fireBuf > 0) tryThrow();

    if (G.invuln > 0) G.invuln -= dt;

    const pb = pBox();
    let i, u;
    for (i = 0; i < G.pickups.length; i++) {
      u = G.pickups[i];
      if (u.taken) continue;
      if (overlap(pb.x, pb.y, pb.w, pb.h, u.x - 10, u.y - 10, 20, 20)) takePickup(u);
    }
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    const mul = spdMul(isTide(), G.stage);
    if (e.hitN > 0) e.hitN -= dt;
    e.t += dt;
    if (!onScreen(e.x, 90) && e.kind !== 'plant') return;
    const p = G.player;

    if (e.kind === 'zombie' && e.buried) {
      if (p && Math.abs(p.x - e.x) < 210 && onScreen(e.x, 20) && playing()) {
        e.buried = false;
        e.emerge = 0.46;
        e.vy = -110;
        e.grounded = false;
        if (playing()) {
          audio.spawn();
          emit(7, {
            x: e.x, y: e.y - 4, j: 8,
            vx0: -50, vx1: 50, vy0: -90, vy1: -8,
            life: 0.3, r0: 1, r1: 2.6, rgb: MOSS, g: 260
          });
        }
      }
      return;
    }

    if (e.emerge > 0) {
      e.emerge -= dt;
      e.vy += GRAV * dt;
      e.y += e.vy * dt;
      const plat = landOn(e.x, e.y - 4, e.y);
      if (plat) {
        e.y = plat.y;
        e.vy = 0;
        e.grounded = true;
      }
      return;
    }

    if (e.kind === 'zombie') {
      const dir = p && p.x > e.x ? 1 : -1;
      e.face = dir;
      e.vx = dir * 46 * mul;
      if (e.a && e.x < e.a) e.vx = Math.abs(e.vx);
      if (e.b && e.x > e.b) e.vx = -Math.abs(e.vx);
      if (pitAhead(e.x, e.y, e.vx > 0 ? 1 : -1) && e.grounded) e.vx = 0;
      e.x += e.vx * dt;
      e.vy += GRAV * dt;
      const y0 = e.y;
      e.y += e.vy * dt;
      const plat = landOn(e.x, y0, e.y);
      if (plat) {
        e.y = plat.y;
        e.vy = 0;
        e.grounded = true;
      } else if (e.y > VH + 40) {
        e.dead = true;
      }
    } else if (e.kind === 'hop') {
      const dir = p && p.x > e.x ? 1 : -1;
      e.face = dir;
      e.hopT -= dt;
      if (e.grounded) {
        e.vx = dir * 28 * mul;
        if (e.a && e.x < e.a) e.vx = Math.abs(e.vx);
        if (e.b && e.x > e.b) e.vx = -Math.abs(e.vx);
        if (e.hopT <= 0) {
          e.vy = -280 - mul * 20;
          e.grounded = false;
          e.hopT = (isTide() ? 0.7 : 0.95) / mul;
          e.vx = dir * 90 * mul;
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
      } else if (e.y > VH + 40) {
        e.dead = true;
      }
    } else if (e.kind === 'plant') {
      if (p) e.face = p.x > e.x ? 1 : -1;
      e.fire -= dt;
      e.snap -= dt;
      const dist = p ? Math.abs(p.x - e.x) : 999;
      const close = dist < 34 && p && Math.abs(p.y - e.y) < 28;
      if (close && e.snap <= 0 && playing()) {
        e.snap = (isTide() ? 0.85 : 1.15) / mul;
        e.state = 'bite';
        audio.snap();
        emit(5, {
          x: e.x + e.face * 10, y: e.y - 14, j: 5,
          vx0: e.face * 40, vx1: e.face * 90, vy0: -40, vy1: 10,
          life: 0.18, r0: 1, r1: 2.2, rgb: LEAF
        });
        if (G.deadT <= 0 && G.invuln <= 0) {
          const pb = pBox();
          if (overlap(pb.x, pb.y, pb.w, pb.h, e.x - 16, e.y - 26, 32, 26)) hurtPlayer('touch');
        }
      } else if (e.fire <= 0 && playing() && p && dist < 280) {
        e.fire = (isTide() ? 1.05 : 1.45) / mul;
        const dx = p.x - e.x;
        const dy = p.y - 14 - (e.y - 14);
        const len = Math.max(40, hypot(dx, dy));
        enemyShot(e.x + e.face * 8, e.y - 16, (dx / len) * 150 * mul, (dy / len) * 130, 1);
      }
      if (e.state === 'bite' && e.snap < 0.7) e.state = 'idle';
    } else if (e.kind === 'arremer') {
      e.fire -= dt;
      const cycle = e.t % 4.2;
      if (cycle > 3.2) {
        e.state = 'swoop';
        e.x += e.face * 110 * mul * dt;
        e.y += 90 * dt;
        if (e.y > GY - 36) e.y = GY - 36;
      } else if (cycle > 2.55 && e.warp <= 0) {
        e.state = 'warp';
        e.warp = 0.22;
        if (playing()) {
          popSpark(e.x, e.y - 10, RED, 16);
          emit(8, {
            x: e.x, y: e.y - 10, j: 8,
            vx0: -90, vx1: 90, vy0: -80, vy1: 20,
            life: 0.22, r0: 1, r1: 2.4, rgb: RED
          });
        }
        const nx = p ? p.x + (p.x > e.x ? -70 : 70) : e.x;
        e.x = clamp(nx, e.a || e.x - 80, e.b || e.x + 80);
        e.y = e.homeY;
      } else {
        e.state = 'hover';
        if (p) e.face = p.x > e.x ? 1 : -1;
        e.x += e.face * 26 * mul * dt;
        e.y = e.homeY + Math.sin(e.t * 2.2 + e.id) * 16;
        if (e.a && e.x < e.a) { e.x = e.a; e.face = 1; }
        if (e.b && e.x > e.b) { e.x = e.b; e.face = -1; }
      }
      if (e.warp > 0) e.warp -= dt;
      if (e.fire <= 0 && playing() && p && e.state !== 'warp') {
        e.fire = (isTide() ? 1.0 : 1.4) / mul;
        const dx = p.x - e.x;
        const dy = p.y - 16 - e.y;
        const len = Math.max(40, hypot(dx, dy));
        enemyShot(e.x, e.y, (dx / len) * 190 * mul, (dy / len) * 155, 1);
      }
    }

    if (playing() && G.deadT <= 0 && G.invuln <= 0 && !e.buried) {
      const pb = pBox();
      const eb = eBox(e);
      if (overlap(pb.x, pb.y, pb.w, pb.h, eb.x, eb.y, eb.w, eb.h)) {
        hurtPlayer('touch');
      }
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    const p = G.player;
    const mul = spdMul(isTide(), G.stage);
    if (b.hitN > 0) b.hitN -= dt;
    if (!b.active) {
      if (playing() && p && p.x > G.levelW - VW + 70) {
        b.active = true;
        b.state = 'idle';
        b.fire = 0.7;
        audio.boss();
        toast(b.name, false, true);
        kick(4.2, 'boom');
        syncHud();
      }
      return;
    }
    b.t += dt;
    b.fire -= dt;
    if (b.warp > 0) b.warp -= dt;
    b.face = p && p.x < b.x ? -1 : 1;

    const minX = G.levelW - VW + 50;
    const maxX = G.levelW - 46;
    const cycle = b.t % (b.kind === '门卫' ? 3.4 : 4.0);

    if (b.kind === '焰魔' || b.kind === '门卫') {
      if (cycle > (b.kind === '门卫' ? 2.5 : 3.1) && b.warp <= 0) {
        b.warp = 0.28;
        popSpark(b.x, b.y - 16, RED, 20);
        b.x = clamp((p ? p.x : b.x) + (Math.random() > 0.5 ? 90 : -90), minX, maxX);
        b.y = b.homeY + rand(-10, 18);
      }
    }

    if (cycle > 2.2 && cycle < 2.85) {
      b.state = 'swoop';
      b.x += b.face * 80 * mul * dt;
      b.y += 70 * dt;
      if (b.y > GY - 40) b.y = GY - 40;
    } else {
      b.state = 'hover';
      b.y = b.homeY + Math.sin(b.t * 1.7) * 22;
      b.x += Math.sin(b.t * 0.8) * 64 * dt * mul;
    }
    if (b.x < minX) b.x = minX;
    if (b.x > maxX) b.x = maxX;

    if (b.fire <= 0 && playing()) {
      const low = b.hp < b.max * 0.4;
      b.fire = (low ? 0.55 : (b.kind === '门卫' ? 0.78 : 1.0)) / mul;
      const dir = b.face;
      if (b.kind === '赤魔') {
        enemyShot(b.x + dir * 10, b.y, dir * 200, 20, 1);
        if (low) enemyShot(b.x, b.y + 6, dir * 140, 90, 1);
      } else if (b.kind === '焰魔') {
        let k;
        for (k = -1; k <= 1; k++) {
          enemyShot(b.x, b.y + 6, k * 80, 150, 1);
        }
        if (low) enemyShot(b.x + dir * 8, b.y, dir * 220, 10, 1);
      } else {
        enemyShot(b.x + dir * 12, b.y - 6, dir * 230, 0, 1);
        enemyShot(b.x + dir * 8, b.y + 4, dir * 190, 70, 1);
        enemyShot(b.x, b.y + 8, 0, 170, 1);
        if (low) {
          enemyShot(b.x - dir * 10, b.y, -dir * 180, 40, 1);
        }
      }
    }

    if (playing() && G.deadT <= 0 && G.invuln <= 0 && p) {
      const pb = pBox();
      if (overlap(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.5, b.y - b.h, b.w, b.h)) {
        hurtPlayer('touch');
      }
    }
  }

  function openGate() {
    const g = G.gate;
    if (!g || g.open) return;
    g.open = true;
    audio.gate();
    toast('魔门开了', false, true);
    popSpark(g.x, g.y - 40, HOT, 28);
    juice(g.x, g.y - 36, HOT, 1.4);
    kick(4.4, 'boom');
    syncHud();
  }

  function bossDie() {
    const b = G.boss;
    if (!b || b.dead) return;
    b.dead = true;
    b.active = false;
    const pts = SCORE.boss * G.mult;
    bumpCombo();
    addScore(pts);
    floatText(b.x, b.y - 40, '+' + pts, GOLD, true);
    juice(b.x, b.y - 20, GOLD, 2.2);
    audio.boom();
    hitStop(0.08);
    kick(6, 'boom');
    openGate();
  }

  function hurtBoss(dmg, x, y) {
    const b = G.boss;
    if (!b || !b.active || b.dead) return false;
    b.hp -= dmg;
    b.hitN = 0.1;
    emit(5, {
      x: x, y: y, j: 6,
      vx0: -100, vx1: 100, vy0: -140, vy1: -10,
      life: 0.2, r0: 1, r1: 2.4, rgb: GOLD
    });
    if (b.hp <= 0) bossDie();
    return true;
  }

  function gateDie() {
    const g = G.gate;
    if (!g || g.dead) return;
    g.dead = true;
    g.open = false;
    const pts = SCORE.gate * G.mult;
    bumpCombo();
    addScore(pts);
    addScore(SCORE.stage * G.stage);
    floatText(g.x, g.y - 50, '破门', GOLD, true);
    juice(g.x, g.y - 36, GOLD, 2.4);
    audio.boom();
    hitStop(0.08);
    kick(6.4, 'boom');
    screenFlash(GOLD, 0.4);
    G.clearT = 1.55;
    toast(STAGES[G.stage - 1].name + ' 通关', false, true);
  }

  function hurtGate(dmg, x, y) {
    const g = G.gate;
    if (!g || !g.open || g.dead) return false;
    g.hp -= dmg;
    g.hitN = 0.12;
    emit(6, {
      x: x, y: y, j: 7,
      vx0: -120, vx1: 120, vy0: -160, vy1: -10,
      life: 0.24, r0: 1.2, r1: 2.8, rgb: HOT
    });
    popSpark(x, y, HOT, 12);
    audio.hit(G.combo);
    hitStop(0.05);
    if (g.hp <= 0) gateDie();
    return true;
  }

  function updateShots(dt) {
    const p = G.player;
    let i, s, j, e;
    for (i = G.shots.length - 1; i >= 0; i--) {
      s = G.shots[i];
      s.life -= dt;
      if (s.pool) {
        s.tick = (s.tick || 0) + dt;
        if (s.tick > 0.28) {
          s.hit = {};
          s.tick = 0;
        }
      } else {
        if (s.grav) s.vy += s.grav * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.rot += dt * (s.kind === 'fire' ? 8 : 5);
        if (s.wantPool && s.vy > 40) {
          const plat = landOn(s.x, s.y - 6, s.y + 4);
          if (plat) {
            s.pool = true;
            s.y = plat.y - 4;
            s.vx = 0;
            s.vy = 0;
            s.life = 1.32;
            s.w = 18;
            s.h = 10;
            emit(6, {
              x: s.x, y: s.y, j: 6,
              vx0: -40, vx1: 40, vy0: -60, vy1: -10,
              life: 0.25, r0: 1.4, r1: 3, rgb: ORG
            });
          }
        }
      }
      if (s.life <= 0 || s.x < G.camX - 40 || s.x > G.camX + VW + 50 || s.y < -40 || s.y > VH + 50) {
        G.shots.splice(i, 1);
        continue;
      }

      if (s.from === 'p') {
        for (j = 0; j < G.ents.length; j++) {
          e = G.ents[j];
          if (e.dead) continue;
          const eb = eBox(e);
          if (overlap(s.x - s.w * 0.5, s.y - s.h * 0.5, s.w, s.h, eb.x, eb.y, eb.w, eb.h)) {
            if (s.hit[e.id]) continue;
            s.hit[e.id] = true;
            hurtEnt(e, s.dmg, s.x, s.y);
            if (!s.pool) {
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
              audio.hit(G.combo);
              if (!s.pool) {
                G.shots.splice(i, 1);
                s = null;
              }
            }
          }
        }
        if (!s) continue;
        const gt = G.gate;
        if (gt && gt.open && !gt.dead) {
          if (overlap(s.x - s.w * 0.5, s.y - s.h * 0.5, s.w, s.h, gt.x - gt.w * 0.5, gt.y - gt.h, gt.w, gt.h)) {
            if (!s.hit['g']) {
              s.hit['g'] = true;
              hurtGate(s.dmg, s.x, s.y);
              if (!s.pool) G.shots.splice(i, 1);
            }
          }
        }
      } else if (playing() && p && G.deadT <= 0) {
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
    if (G.gate && G.gate.open && !G.gate.dead) tx = G.levelW - VW;
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
    for (i = shards.length - 1; i >= 0; i--) {
      o = shards[i];
      o.life -= dt;
      o.vy += 720 * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.rot += o.vr * dt;
      if (o.life <= 0) shards.splice(i, 1);
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
    if (G.gate) G.gate.t += dt;
    if (G.gate && G.gate.hitN > 0) G.gate.hitN -= dt;
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
    updateShots(dt);
    updateCam(dt);
  }

  function drawSky() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (spec.theme === 'gate') {
      g.addColorStop(0, '#1c0608');
      g.addColorStop(0.5, '#140406');
      g.addColorStop(1, '#0c0204');
    } else if (spec.theme === 'cliff') {
      g.addColorStop(0, '#18080a');
      g.addColorStop(0.55, '#10060a');
      g.addColorStop(1, '#0a0406');
    } else {
      g.addColorStop(0, '#14080a');
      g.addColorStop(0.5, '#10060a');
      g.addColorStop(1, '#0a0406');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const mx = sx(G.camX + VW * 0.78);
    const my = sy(G.camY + 44);
    ctx.fillStyle = rgba(isTide() ? RED : HOT, isTide() ? 0.72 : 0.52);
    ctx.beginPath();
    ctx.arc(mx, my, (isTide() ? 26 : 20) * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(ORG, 0.22);
    ctx.beginPath();
    ctx.arc(mx - 5 * scale, my - 4 * scale, 8 * scale, 0, TAU);
    ctx.fill();

    let i, sx0, sy0;
    for (i = 0; i < 16; i++) {
      sx0 = sx(((hash2(i + G.stage * 3) * G.levelW) - G.camX * 0.15));
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
      if (spec.theme === 'gate') {
        ctx.fillStyle = i % 3 === 0 ? '#1c0a0c' : '#140608';
        ctx.fillRect(x, base - h, w, h + 40 * scale);
        ctx.fillStyle = hash2(i + 3) > 0.45 ? rgba(HOT, 0.34) : rgba(GOLD, 0.16);
        ctx.fillRect(x + 6 * scale, base - h + 10 * scale, 4 * scale, 5 * scale);
        ctx.fillRect(x + 16 * scale, base - h + 22 * scale, 4 * scale, 5 * scale);
      } else if (spec.theme === 'cliff') {
        ctx.fillStyle = i % 2 ? '#1a0c0e' : '#12080a';
        ctx.beginPath();
        ctx.moveTo(x, base);
        ctx.lineTo(x + w * 0.2, base - h);
        ctx.lineTo(x + w, base - h * 0.4);
        ctx.lineTo(x + w, base);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = i % 2 ? '#14100c' : '#100c0a';
        ctx.beginPath();
        ctx.moveTo(x, base);
        ctx.lineTo(x + w * 0.5, base - h);
        ctx.lineTo(x + w, base);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(LEAF, 0.16);
        ctx.beginPath();
        ctx.arc(x + w * 0.5, base - h + 6 * scale, 8 * scale, 0, TAU);
        ctx.fill();
      }
    }
    for (i = 0; i < mist.length; i++) {
      const m = mist[i];
      ctx.fillStyle = rgba(isTide() ? RED : WHT, m.a * (isTide() ? 1.2 : 1));
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
    ctx.fillStyle = 'rgba(4, 0, 2, 0.72)';
    ctx.fillRect(sx(G.camX - 10), y, (VW + 20) * scale, 56 * scale);
    ctx.strokeStyle = rgba(HOT, 0.28);
    ctx.lineWidth = 1.3 * scale;
    ctx.beginPath();
    let x;
    for (x = G.camX - 20; x < G.camX + VW + 20; x += 8) {
      const yy = GY + 10 + Math.sin(x * 0.09 + G.clock * 2.8) * 2.2;
      if (x === G.camX - 20) ctx.moveTo(sx(x), sy(yy));
      else ctx.lineTo(sx(x), sy(yy));
    }
    ctx.stroke();
    let covered;
    for (x = G.camX; x < G.camX + VW; x += 16) {
      covered = false;
      for (let i = 0; i < G.plats.length; i++) {
        const p = G.plats[i];
        if (p.base && x >= p.x && x <= p.x + p.w) { covered = true; break; }
      }
      if (!covered) {
        ctx.fillStyle = rgba(HOT, 0.12 + Math.sin(x * 0.04 + G.clock * 3) * 0.05);
        ctx.fillRect(sx(x), y, 16 * scale, 40 * scale);
      }
    }
  }

  function drawPlats() {
    const s = scale;
    let i, p, x, y, w;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (p.x + p.w < G.camX - 20 || p.x > G.camX + VW + 20) continue;
      x = sx(p.x);
      y = sy(p.y);
      w = p.w * s;
      if (p.base) {
        ctx.fillStyle = '#2a1410';
        ctx.fillRect(x, y, w, 42 * s);
        ctx.fillStyle = '#3a1c14';
        ctx.fillRect(x, y, w, 8 * s);
        ctx.fillStyle = rgba(HOT, 0.28);
        ctx.fillRect(x, y, w, 2.2 * s);
        let t;
        for (t = 6; t < p.w; t += 18) {
          ctx.fillStyle = 'rgba(0,0,0,0.22)';
          ctx.fillRect(sx(p.x + t), y + 12 * s, 8 * s, 18 * s);
        }
      } else {
        ctx.fillStyle = '#241410';
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
    const rgb = u.kind === 'armor' ? STEEL : (WEAPONS[u.kind] ? WEAPONS[u.kind].rgb : GOLD);
    ctx.fillStyle = rgba(rgb, 0.2);
    ctx.beginPath();
    ctx.arc(x, y, 11 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.fillRect(x - 8 * scale, y - 8 * scale, 16 * scale, 16 * scale);
    ctx.strokeStyle = rgba(WHT, 0.5);
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 8 * scale, y - 8 * scale, 16 * scale, 16 * scale);
    ctx.fillStyle = '#140808';
    ctx.font = 'bold ' + (9 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const ch = u.kind === 'armor' ? '甲' : u.kind === 'dagger' ? '匕' : u.kind === 'fire' ? '火' : '枪';
    ctx.fillText(ch, x, y + 0.5 * scale);
  }

  function drawEnt(e) {
    if (e.dead) return;
    if (e.buried) {
      if (!onScreen(e.x, 10)) return;
      const x = sx(e.x);
      const y = sy(e.y);
      ctx.fillStyle = rgba(MOSS, 0.55);
      ctx.fillRect(x - 6 * scale, y - 4 * scale, 12 * scale, 4 * scale);
      return;
    }
    if (!onScreen(e.x, 24)) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const flash = e.hitN > 0 && ((G.t * 24) | 0) % 2 === 0;
    const s = scale;
    if (e.kind === 'plant') {
      const bite = e.state === 'bite';
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#1a3018';
      ctx.fillRect(x - 4 * s, y - 10 * s, 8 * s, 10 * s);
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : rgba(LEAF, 0.92);
      ctx.beginPath();
      ctx.ellipse(x, y - (bite ? 18 : 16) * s, (bite ? 12 : 9) * s, 8 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.beginPath();
      ctx.ellipse(x + e.face * 3 * s, y - 16 * s, 5 * s, bite ? 5 * s : 2.4 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(x + e.face * 4 * s, y - 17 * s, 1.8 * s, 0, TAU);
      ctx.fill();
      return;
    }
    if (e.kind === 'arremer') {
      if (e.warp > 0.08 && ((G.t * 20) | 0) % 2 === 0) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(e.face, 1);
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : rgba(RED, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, -10 * s, 10 * s, 8 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.95);
      ctx.beginPath();
      ctx.arc(2 * s, -18 * s, 5.4 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(4 * s, -19 * s, 1.8 * s, 0, TAU);
      ctx.fill();
      const wing = Math.sin(G.clock * 10 + e.id) * 5 * s;
      ctx.fillStyle = rgba(CRIM, 0.85);
      ctx.beginPath();
      ctx.moveTo(-2 * s, -10 * s);
      ctx.lineTo(-18 * s, -18 * s - wing);
      ctx.lineTo(-6 * s, -2 * s);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(4 * s, -8 * s);
      ctx.lineTo(16 * s, -16 * s + wing);
      ctx.lineTo(6 * s, 0);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.7);
      ctx.fillRect(4 * s, -8 * s, 8 * s, 2 * s);
      ctx.restore();
      return;
    }
    if (e.kind === 'hop') {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(e.face, 1);
      const bounce = e.grounded ? 0 : -3 * s;
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#3a78a8';
      ctx.beginPath();
      ctx.ellipse(0, -8 * s + bounce, 8 * s, 7 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.9);
      ctx.beginPath();
      ctx.arc(3 * s, -10 * s + bounce, 2 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.85);
      ctx.fillRect(-2 * s, -4 * s + bounce, 3 * s, 4 * s);
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(e.face, 1);
    const walk = Math.sin(e.t * 7) * 3 * s;
    const rise = e.emerge > 0 ? (1 - e.emerge / 0.46) : 1;
    ctx.globalAlpha = 0.45 + 0.55 * rise;
    ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#6a7a58';
    ctx.fillRect(-5 * s, -16 * s, 10 * s, 12 * s);
    ctx.fillStyle = '#8aaa70';
    ctx.fillRect(-4 * s, -24 * s, 8 * s, 8 * s);
    ctx.fillStyle = rgba(RED, 0.85);
    ctx.fillRect(-2.4 * s, -21 * s, 2 * s, 2 * s);
    ctx.fillStyle = '#4a5a38';
    ctx.fillRect(-5 * s, -6 * s, 3 * s, 6 * s + walk);
    ctx.fillRect(2 * s, -6 * s, 3 * s, 6 * s - walk);
    ctx.restore();
  }

  function drawBoss() {
    const b = G.boss;
    if (!b || b.dead) return;
    if (!b.active && !onScreen(b.x, 20)) return;
    if (b.warp > 0.1 && ((G.t * 18) | 0) % 2 === 0) return;
    const x = sx(b.x);
    const y = sy(b.y);
    const flash = b.hitN > 0 && ((G.t * 24) | 0) % 2 === 0;
    const s = scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(b.face, 1);
    ctx.fillStyle = flash ? rgba(WHT, 0.9) : (b.kind === '门卫' ? rgba(CRIM, 0.96) : rgba(RED, 0.95));
    ctx.beginPath();
    ctx.ellipse(0, -14 * s, 18 * s, 13 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.beginPath();
    ctx.arc(4 * s, -28 * s, 10 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(8 * s, -30 * s, 2.6 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(STEEL, 0.7);
    ctx.beginPath();
    ctx.moveTo(-2 * s, -34 * s);
    ctx.lineTo(2 * s, -46 * s);
    ctx.lineTo(8 * s, -34 * s);
    ctx.fill();
    const wing = Math.sin(G.clock * 8) * 8 * s;
    ctx.fillStyle = rgba(b.kind === '焰魔' ? ORG : CRIM, 0.82);
    ctx.beginPath();
    ctx.moveTo(-4 * s, -14 * s);
    ctx.lineTo(-32 * s, -30 * s - wing);
    ctx.lineTo(-8 * s, 2 * s);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(6 * s, -12 * s);
    ctx.lineTo(30 * s, -26 * s + wing);
    ctx.lineTo(10 * s, 2 * s);
    ctx.fill();
    ctx.restore();
  }

  function drawGate() {
    const g = G.gate;
    if (!g || g.dead) return;
    if (!onScreen(g.x, 20) && !(g.open)) return;
    const s = scale;
    const x = sx(g.x);
    const y = sy(g.y);
    const flash = g.hitN > 0 && ((G.t * 22) | 0) % 2 === 0;
    const cracked = g.open ? 1 - g.hp / g.max : 0;
    ctx.fillStyle = flash ? rgba(WHT, 0.8) : '#2a1010';
    ctx.fillRect(x - 18 * s, y - 78 * s, 8 * s, 78 * s);
    ctx.fillRect(x + 10 * s, y - 78 * s, 8 * s, 78 * s);
    ctx.fillStyle = rgba(HOT, g.open ? 0.55 : 0.22);
    ctx.beginPath();
    ctx.moveTo(x - 18 * s, y - 78 * s);
    ctx.quadraticCurveTo(x, y - 102 * s, x + 18 * s, y - 78 * s);
    ctx.lineTo(x + 10 * s, y - 78 * s);
    ctx.quadraticCurveTo(x, y - 94 * s, x - 10 * s, y - 78 * s);
    ctx.fill();
    if (g.open) {
      const swirl = G.clock * 3;
      ctx.fillStyle = rgba(HOT, 0.35 + cracked * 0.25);
      ctx.beginPath();
      ctx.ellipse(x, y - 42 * s, 12 * s, 28 * s, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.55);
      ctx.lineWidth = 1.6 * s;
      ctx.beginPath();
      ctx.arc(x, y - 42 * s, 10 * s, swirl, swirl + 2.2);
      ctx.stroke();
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.font = 'bold ' + (9 * s) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('门', x, y - 86 * s);
    } else {
      ctx.fillStyle = rgba(CRIM, 0.45);
      ctx.fillRect(x - 9 * s, y - 70 * s, 18 * s, 62 * s);
    }
  }

  function drawShot(s) {
    const x = sx(s.x);
    const y = sy(s.y);
    const sc = scale;
    if (s.pool) {
      ctx.fillStyle = rgba(ORG, 0.35 + Math.sin(G.clock * 12) * 0.12);
      ctx.beginPath();
      ctx.ellipse(x, y, 14 * sc, 6 * sc, 0, 0, TAU);
      ctx.fill();
      return;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(s.rot * (s.vx >= 0 ? 1 : -1) * 0.15);
    ctx.fillStyle = rgba(s.rgb, 0.95);
    if (s.kind === 'dagger') {
      ctx.fillRect(-5 * sc, -1.4 * sc, 10 * sc, 2.8 * sc);
    } else if (s.kind === 'fire' || s.kind === 'ball') {
      ctx.beginPath();
      ctx.arc(0, 0, 5 * sc, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillRect(-8 * sc, -1.6 * sc, 16 * sc, 3.2 * sc);
    }
    ctx.restore();
  }

  function drawKnight(p) {
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
    const leg = Math.sin(p.run || 0) * 5 * s;
    const bodyH = 15;
    const throwOff = G.throwT > 0 ? 6 * s : 0;

    ctx.strokeStyle = rgba(G.armor ? STEEL : SKIN, 0.95);
    ctx.lineWidth = 2.2 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3 * s, -6 * s);
    ctx.lineTo(-4 * s + (p.grounded ? -leg : 2 * s), 0);
    ctx.moveTo(3 * s, -6 * s);
    ctx.lineTo(4 * s + (p.grounded ? leg : -2 * s), 0);
    ctx.stroke();
    ctx.fillStyle = rgba(STEEL, 0.95);
    ctx.fillRect(-5 * s, -3 * s, 3.4 * s, 3.2 * s);
    ctx.fillRect(1.6 * s, -3 * s, 3.4 * s, 3.2 * s);

    if (!G.armor) {
      ctx.fillStyle = rgba(RED, 0.98);
      ctx.fillRect(-5.8 * s, -9 * s, 11.6 * s, 6.2 * s);
      ctx.fillStyle = rgba(WHT, 0.35);
      ctx.fillRect(-2 * s, -8.4 * s, 4 * s, 2 * s);
    }

    ctx.fillStyle = rgba(G.armor ? STEEL : SKIN, 0.96);
    ctx.fillRect(-6.2 * s, -bodyH * s - 6 * s, 12.4 * s, bodyH * s);
    if (G.armor) {
      ctx.fillStyle = rgba(GOLD, 0.45);
      ctx.fillRect(-6.2 * s, -bodyH * s - 6 * s, 12.4 * s, 2 * s);
      ctx.fillStyle = rgba(HOT, 0.6);
      ctx.fillRect(-6.2 * s, -bodyH * s + 2 * s, 12.4 * s, 2 * s);
    }

    ctx.fillStyle = rgba(HOT, 0.8);
    ctx.beginPath();
    ctx.moveTo(-6 * s, -bodyH * s - 4 * s);
    ctx.lineTo(-12 * s, -bodyH * s + 6 * s);
    ctx.lineTo(-6 * s, -bodyH * s + 8 * s);
    ctx.fill();

    ctx.fillStyle = rgba(STEEL, 0.98);
    ctx.fillRect(-5.4 * s, -bodyH * s - 14 * s, 10.8 * s, 8.4 * s);
    ctx.fillStyle = '#1a1010';
    ctx.fillRect(-3.6 * s, -bodyH * s - 11 * s, 7.4 * s, 3.2 * s);
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -bodyH * s - 14 * s);
    ctx.lineTo(5 * s, -bodyH * s - 22 * s);
    ctx.lineTo(2 * s, -bodyH * s - 14 * s);
    ctx.fill();

    const spec = WEAPONS[G.weapon] || WEAPONS.lance;
    ctx.fillStyle = rgba(spec.rgb, 0.95);
    ctx.fillRect(5 * s + throwOff, -bodyH * s - 2 * s, (G.weapon === 'lance' ? 12 : 8) * s, 2.2 * s);
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.beginPath();
      ctx.arc(16 * s + throwOff, -bodyH * s - 1 * s, 3.6 * s, 0, TAU);
      ctx.fill();
    }

    if (G.swapT > 0) {
      ctx.strokeStyle = rgba(GOLD, G.swapT / 0.4);
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.arc(0, -12 * s, 18 * s * (1.15 - G.swapT), 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBossBar() {
    const b = G.boss;
    const g = G.gate;
    let x = ox + 80 * scale;
    let y = oy + 12 * scale;
    const w = (VW - 160) * scale;
    if (g && g.open && !g.dead && playing()) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(x, y, w, 8 * scale);
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(x, y, w * clamp(g.hp / g.max, 0, 1), 8 * scale);
      ctx.strokeStyle = rgba(HOT, 0.55);
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, 8 * scale);
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.font = (10 * scale) + 'px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('魔门', x, y - 3 * scale);
      return;
    }
    if (!b || !b.active || b.dead || !playing()) return;
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
    for (i = 0; i < shards.length; i++) {
      o = shards[i];
      ctx.save();
      ctx.translate(sx(o.x), sy(o.y));
      ctx.rotate(o.rot);
      ctx.fillStyle = rgba(STEEL, clamp(o.life / o.max, 0, 1));
      ctx.fillRect(-o.w * 0.5 * scale, -o.h * 0.5 * scale, o.w * scale, o.h * scale);
      ctx.restore();
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
    ctx.fillStyle = '#0c0402';
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
    drawGate();

    let i;
    for (i = 0; i < G.pickups.length; i++) drawPickup(G.pickups[i]);
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawBoss();
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);

    if (G.player && G.deadT <= 0) drawKnight(G.player);

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

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') {
      keys.u = down;
      if (down && live()) G.jumpBuf = BUFFER;
    }
    if (space) {
      keys.fire = down;
      if (down && live()) G.fireBuf = BUFFER;
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
    hold(document.getElementById('btn-jump'), function () { keys.u = true; if (live()) G.jumpBuf = BUFFER; }, function () { keys.u = false; });
    hold(document.getElementById('btn-fire'), function () { keys.fire = true; if (live()) G.fireBuf = BUFFER; }, function () { keys.fire = false; });
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen()) return;
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

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      keys.l = false;
      keys.r = false;
      keys.u = false;
      keys.fire = false;
    }
  });

  requestAnimationFrame(frame);
})();
