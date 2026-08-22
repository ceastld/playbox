'use strict';

(function () {
  const VW = 640;
  const VH = 360;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.35;
  const GY = 328;
  const MY = 256;
  const HY = 184;
  const WALK = 148;
  const JUMP_V = 430;
  const JUMP_WALL = 418;
  const GRAV = 1150;
  const MAX_FALL = 560;
  const WALL_SLIDE = 78;
  const WALL_KICK_VX = 176;
  const COYOTE = 0.08;
  const BUFFER = 0.12;
  const PW = 14;
  const PH = 26;
  const HP_CITY = 16;
  const HP_BLOOD = 8;
  const NINPO_MAX = 99;
  const NINPO_START = 20;
  const SWORD_T = 0.2;
  const SWORD_RANGE = 36;
  const SUB_CD = 0.26;
  const INVULN = 1.12;
  const DIE_T = 0.82;
  const BEST_KEY = 'playbox-ninja-gaid-best';
  const MUTE_KEY = 'playbox-ninja-gaid-mute';
  const OPS = '方向键 / WASD 走跳 · Z 斩 · C 忍术 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 46, 10];
  const HOT2 = [255, 106, 58];
  const WHT = [246, 240, 238];
  const LEAF = [61, 255, 122];
  const ORG = [255, 154, 58];
  const SKIN = [232, 176, 144];
  const STN = [150, 120, 118];

  const SUB_NAME = { star: '手里剑', mill: '风车', fire: '炎轮', '': '—' };
  const SUB_COST = { star: 3, mill: 5, fire: 8 };
  const SCORE = {
    bird: 100, dog: 150, soldier: 200, lantern: 50,
    boss: 3800, stage: 1600
  };

  const STAGES = [
    {
      name: '巷口', boss: '蛮将', w: 2360, hp: 18, theme: 'alley',
      ground: [[0, 500], [580, 500], [1180, 600], [1860, 500]],
      plats: [
        [200, MY, 150], [620, MY, 160], [980, MY, 150], [1400, MY, 180],
        [1720, MY, 150], [2040, MY, 160],
        [280, HY, 120], [760, HY, 140], [1260, HY, 150], [1660, HY, 140], [2100, HY, 130]
      ],
      walls: [
        [350, HY - 12, GY], [620, MY - 8, GY],
        [860, HY - 16, GY], [908, HY - 16, GY],
        [1400, MY - 8, GY], [1720, HY - 8, GY]
      ],
      lanterns: [
        [160, GY - 36, 'nin'], [260, MY - 28, 'hp'], [340, HY - 28, 'star'],
        [700, GY - 36, 'nin'], [820, HY - 28, 'hp'], [1080, MY - 28, 'mill'],
        [1320, GY - 36, 'nin'], [1480, MY - 28, 'hp'], [1680, HY - 28, 'fire'],
        [1980, GY - 36, 'nin'], [2140, MY - 28, 'hp']
      ],
      ents: [
        [240, GY, 'soldier', 40, 480],
        [380, GY, 'soldier', 80, 490],
        [320, MY, 'bird', 200, 360],
        [700, GY, 'dog', 580, 1040],
        [780, GY, 'soldier', 600, 1060],
        [860, HY, 'bird', 760, 920],
        [1040, GY, 'soldier', 980, 1160],
        [1120, MY, 'bird', 980, 1140],
        [1280, GY, 'dog', 1180, 1740],
        [1460, GY, 'soldier', 1200, 1760],
        [1540, MY, 'bird', 1400, 1580],
        [1680, HY, 'bird', 1660, 1800],
        [1960, GY, 'soldier', 1860, 2280],
        [2100, MY, 'bird', 2040, 2200]
      ]
    },
    {
      name: '塔影', boss: '铁拳', w: 2680, hp: 24, theme: 'tower',
      ground: [[0, 460], [540, 320], [960, 420], [1500, 360], [1980, 700]],
      plats: [
        [140, MY, 150], [400, MY, 170], [720, MY, 170], [1080, MY, 160],
        [1440, MY, 180], [1820, MY, 170], [2220, MY, 160], [2480, MY, 140],
        [220, HY, 130], [640, HY, 150], [1120, HY, 150], [1580, HY, 140],
        [2000, HY, 150], [2360, HY, 140]
      ],
      walls: [
        [260, HY - 12, GY], [400, MY - 8, GY],
        [700, HY - 16, GY], [748, HY - 16, GY],
        [1120, HY - 12, GY], [1440, MY - 8, GY],
        [1820, HY - 16, GY], [1868, HY - 16, GY],
        [2220, MY - 8, GY]
      ],
      lanterns: [
        [120, GY - 36, 'nin'], [180, MY - 28, 'hp'], [260, HY - 28, 'star'],
        [520, GY - 36, 'nin'], [700, HY - 28, 'mill'], [980, GY - 36, 'hp'],
        [1160, HY - 28, 'nin'], [1500, MY - 28, 'fire'], [1700, GY - 36, 'hp'],
        [2020, HY - 28, 'nin'], [2280, MY - 28, 'life'], [2500, GY - 36, 'hp']
      ],
      ents: [
        [200, GY, 'soldier', 20, 440],
        [360, MY, 'dog', 140, 310],
        [460, HY, 'bird', 220, 360],
        [640, GY, 'dog', 540, 840],
        [780, GY, 'soldier', 560, 860],
        [860, MY, 'bird', 720, 890],
        [1040, GY, 'dog', 960, 1360],
        [1180, HY, 'bird', 1120, 1270],
        [1320, GY, 'soldier', 980, 1380],
        [1500, MY, 'dog', 1440, 1620],
        [1660, GY, 'soldier', 1500, 1840],
        [1780, HY, 'bird', 1580, 1720],
        [1940, GY, 'dog', 1980, 2480],
        [2120, GY, 'soldier', 2000, 2500],
        [2280, MY, 'bird', 2220, 2380],
        [2440, HY, 'bird', 2360, 2500]
      ]
    },
    {
      name: '魔殿', boss: '邪神', w: 2920, hp: 32, theme: 'hall',
      ground: [[0, 440], [520, 300], [940, 360], [1440, 320], [1900, 360], [2420, 500]],
      plats: [
        [120, MY, 150], [360, MY, 160], [680, MY, 170], [1020, MY, 170],
        [1380, MY, 180], [1760, MY, 170], [2140, MY, 180], [2540, MY, 160],
        [220, HY, 130], [600, HY, 140], [1080, HY, 150], [1520, HY, 140],
        [1960, HY, 150], [2400, HY, 140]
      ],
      walls: [
        [220, HY - 12, GY], [360, MY - 8, GY],
        [640, HY - 16, GY], [688, HY - 16, GY],
        [1080, HY - 12, GY], [1380, MY - 8, GY],
        [1760, HY - 16, GY], [1808, HY - 16, GY],
        [2140, MY - 8, GY], [2540, HY - 12, GY]
      ],
      lanterns: [
        [140, GY - 36, 'nin'], [180, MY - 28, 'star'], [260, HY - 28, 'hp'],
        [540, GY - 36, 'nin'], [680, HY - 28, 'mill'], [980, GY - 36, 'hp'],
        [1120, HY - 28, 'fire'], [1460, MY - 28, 'nin'], [1680, GY - 36, 'hp'],
        [2000, HY - 28, 'life'], [2200, MY - 28, 'nin'], [2480, GY - 36, 'hp'],
        [2600, MY - 28, 'fire'], [2760, GY - 36, 'nin']
      ],
      ents: [
        [220, GY, 'soldier', 20, 420],
        [340, MY, 'dog', 120, 280],
        [440, HY, 'bird', 220, 360],
        [620, GY, 'dog', 540, 820],
        [780, GY, 'soldier', 540, 860],
        [860, MY, 'bird', 680, 850],
        [1080, GY, 'soldier', 940, 1280],
        [1160, HY, 'bird', 1080, 1230],
        [1320, GY, 'dog', 960, 1320],
        [1480, MY, 'soldier', 1380, 1560],
        [1640, GY, 'dog', 1440, 1760],
        [1820, HY, 'bird', 1520, 1660],
        [1960, GY, 'soldier', 1900, 2240],
        [2100, MY, 'dog', 1760, 1930],
        [2260, GY, 'soldier', 1920, 2260],
        [2380, HY, 'bird', 2400, 2540],
        [2560, GY, 'dog', 2420, 2860],
        [2700, MY, 'bird', 2540, 2700],
        [2780, GY, 'soldier', 2440, 2880]
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
  function wallJumpHeight() {
    return (JUMP_WALL * JUMP_WALL) / (2 * GRAV);
  }
  function spdMul(blood, stage) {
    return (blood ? 1.18 : 1) * (1 + Math.max(0, stage - 1) * 0.08);
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
  function maxHpOf(kind) {
    return kind === 'blood' ? HP_BLOOD : HP_CITY;
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
    if (HP_BLOOD >= HP_CITY) throw new Error('blood less hp');
    if (HP_BLOOD !== 8 || HP_CITY !== 16) throw new Error('hp bars');
    if (!SUB_COST.star || !SUB_COST.mill || !SUB_COST.fire) throw new Error('subs');
    if (!(SUB_COST.star < SUB_COST.mill && SUB_COST.mill < SUB_COST.fire)) throw new Error('sub cost');
    if (BEST_KEY !== 'playbox-ninja-gaid-best') throw new Error('best key');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('blood faster');
    let i, s;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ground.length || !s.ents.length || !s.walls.length || !s.lanterns.length) {
        throw new Error('stage ' + s.name);
      }
      if (s.walls.length < 4) throw new Error('walls ' + s.name);
      let birds = 0;
      let dogs = 0;
      let sols = 0;
      let k;
      for (k = 0; k < s.ents.length; k++) {
        if (s.ents[k][2] === 'bird') birds += 1;
        if (s.ents[k][2] === 'dog') dogs += 1;
        if (s.ents[k][2] === 'soldier') sols += 1;
      }
      if (birds < 3 || dogs < 1 || sols < 3) throw new Error('dense ' + s.name);
    }
    if (WALL_KICK_VX < WALK) throw new Error('wall kick speed');
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
  const btnCity = document.getElementById('btn-city');
  const btnBlood = document.getElementById('btn-blood');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeCity = document.getElementById('mode-city');
  const modeBlood = document.getElementById('mode-blood');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const comboBox = document.getElementById('combo-box');
  const comboEl = document.getElementById('combo');
  const hpBox = document.getElementById('hp-box');
  const hpEl = document.getElementById('hp');
  const hpFill = document.getElementById('hp-fill');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const ninLabel = document.getElementById('nin-label');
  const subLabel = document.getElementById('sub-label');
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

  const keys = { l: false, r: false, u: false, d: false, fire: false, sub: false };
  const demo = { l: false, r: true, u: false, fire: false, sub: false };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const mist = [];
  const rain = [];

  const G = {
    mode: 'title',
    kind: 'city',
    t: 0,
    clock: 0,
    stage: 1,
    camX: 0,
    camY: 0,
    levelW: 2360,
    plats: [],
    walls: [],
    ents: [],
    shots: [],
    pickups: [],
    lanterns: [],
    player: null,
    boss: null,
    lives: LIVES,
    hp: HP_CITY,
    ninpo: NINPO_START,
    sub: 'star',
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    swordT: 0,
    swordHit: {},
    subCd: 0,
    fireEdge: false,
    subEdge: false,
    checkX: 56,
    checkY: GY,
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
    spawnT: 1.2,
    ninFlash: 0
  };

  function isBlood() {
    return G.kind === 'blood';
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
  function subHeld() {
    return G.mode === 'title' ? demo.sub : keys.sub;
  }
  function maxHp() {
    return maxHpOf(G.kind);
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
      this.beep(260, 0.07, 'square', 0.04, 560);
    },
    land() {
      this.ensure();
      this.noise(0.04, 0.026, 420);
      this.beep(130, 0.05, 'triangle', 0.022, 70);
    },
    cling() {
      this.ensure();
      this.noise(0.03, 0.03, 800);
      this.beep(180, 0.05, 'triangle', 0.03, 90);
    },
    wall() {
      this.ensure();
      this.noise(0.05, 0.05, 600);
      this.beep(320, 0.08, 'square', 0.05, 720);
      this.beep(180, 0.1, 'sawtooth', 0.03, 90);
    },
    slash() {
      this.ensure();
      this.noise(0.05, 0.048, 1600);
      this.beep(880, 0.05, 'sawtooth', 0.04, 220);
      this.beep(1480, 0.04, 'square', 0.028, 480);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.55, combo * 0.045);
      this.noise(0.04, 0.038, 1200);
      this.beep(540 * lift, 0.07, 'square', 0.046, 920 * lift);
    },
    sub(kind) {
      this.ensure();
      if (kind === 'fire') {
        this.beep(180, 0.12, 'sawtooth', 0.05, 80);
        this.noise(0.1, 0.05, 400);
        this.beep(620, 0.1, 'square', 0.04, 240);
      } else if (kind === 'mill') {
        this.beep(440, 0.08, 'square', 0.045, 880);
        this.beep(880, 0.1, 'triangle', 0.035, 1320);
        this.noise(0.05, 0.03, 900);
      } else {
        this.beep(1240, 0.05, 'square', 0.044, 520);
        this.noise(0.025, 0.022, 2200);
      }
    },
    ping() {
      this.ensure();
      this.beep(660, 0.07, 'square', 0.05, 990);
      this.beep(990, 0.1, 'triangle', 0.042, 1320);
    },
    hurt() {
      this.ensure();
      this.noise(0.1, 0.055, 380);
      this.beep(320, 0.12, 'sawtooth', 0.05, 90);
    },
    boom() {
      this.ensure();
      this.noise(0.14, 0.07, 240);
      this.beep(180, 0.16, 'sawtooth', 0.05, 55);
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
    empty() {
      this.ensure();
      this.beep(140, 0.08, 'square', 0.03, 70);
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
    scoreAdd.hidden = false;
    scoreAdd.textContent = '+' + n;
    addTok += 1;
    const tok = addTok;
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
    const b = isBlood();
    if (modeCity) modeCity.setAttribute('aria-pressed', b ? 'false' : 'true');
    if (modeBlood) modeBlood.setAttribute('aria-pressed', b ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (hpEl) hpEl.textContent = String(Math.max(0, G.hp));
    if (hpFill) hpFill.style.transform = 'scaleX(' + clamp(G.hp / maxHp(), 0, 1) + ')';
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      stageLabel.textContent = (isBlood() ? '血战 ' : '') + spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isBlood() ? '血战' : '夜城';
      tagLabel.classList.toggle('warn', isBlood());
      tagLabel.classList.toggle('hot', !isBlood() && G.stage >= 3);
    }
    if (ninLabel) {
      ninLabel.textContent = '忍 ' + G.ninpo;
      ninLabel.classList.toggle('low', G.ninpo < 8);
    }
    if (subLabel) {
      subLabel.textContent = SUB_NAME[G.sub] || '—';
      subLabel.className = 'subw' + (G.sub === 'fire' ? ' fire' : G.sub === 'mill' ? ' mill' : G.sub ? '' : ' off');
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 生命归零丢命，血战生命更少', 'warn');
    else if (G.mode === 'win') setHint('影已散 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · Z 斩 · C 忍术耗忍', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('头目 · ' + spec.boss, 'hot');
    else setHint('走跳贴墙 · Z 斩 · C 忍术 · 灯笼掉忍与武器', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'GAIDEN';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '血战' : '换模式';
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
    stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'pickup', 'win-flash', 'wall');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'pickup', 'win-flash', 'wall');
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
      cling: 0, wallCool: 0, wall: null
    };
  }

  function makePlat(x, y, w, base) {
    return { x: x, y: y, w: w, h: base ? 48 : 12, base: !!base };
  }

  function hpOf(kind) {
    if (kind === 'soldier') return 2;
    return 1;
  }

  function makeEnt(x, y, kind, a, b) {
    const hp = hpOf(kind);
    const fly = kind === 'bird';
    return {
      id: uid++,
      x: x, y: y, vx: 0, vy: 0, face: -1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b, base: y,
      t: rand(0, 2), fire: rand(0.5, 1.6),
      grounded: !fly, dead: false, hitN: 0,
      w: kind === 'dog' ? 18 : kind === 'bird' ? 14 : 14,
      h: kind === 'dog' ? 12 : kind === 'bird' ? 10 : 24
    };
  }

  function makeBoss(spec) {
    const hp = (spec.hp * (isBlood() ? 1.12 : 1)) | 0;
    return {
      id: uid++,
      x: spec.w - 150, y: GY, vx: 0, vy: 0, face: -1,
      hp: hp, max: hp, kind: spec.boss, name: spec.boss,
      t: 0, fire: 1.1, state: 'wait',
      grounded: true, dead: false, active: false,
      hitN: 0, w: 34, h: 46
    };
  }

  function makeLantern(x, y, drop) {
    return { x: x, y: y, drop: drop || 'nin', broken: false, t: rand(0, 3) };
  }

  function fillFx() {
    mist.length = 0;
    rain.length = 0;
    let i;
    for (i = 0; i < 18; i++) {
      mist.push({
        x: rand(0, G.levelW),
        y: rand(40, GY - 40),
        r: rand(18, 46),
        a: rand(0.03, 0.08),
        vx: rand(6, 18)
      });
    }
    for (i = 0; i < 42; i++) {
      rain.push({
        x: rand(0, G.levelW),
        y: rand(0, VH),
        l: rand(8, 16),
        vy: rand(220, 340)
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
    G.lanterns = [];
    for (i = 0; i < spec.lanterns.length; i++) {
      const L = spec.lanterns[i];
      G.lanterns.push(makeLantern(L[0], L[1], L[2]));
    }
    G.shots = [];
    G.pickups = [];
    G.boss = makeBoss(spec);
    G.player = makePlayer(attract ? 90 : 56, GY);
    G.camX = 0;
    G.camY = 0;
    G.checkX = 56;
    G.checkY = GY;
    G.swordT = 0;
    G.swordHit = {};
    G.subCd = 0;
    G.spawnT = 0.8;
    G.lock = 0;
    G.clearT = 0;
    G.deadT = 0;
    G.invuln = attract ? 0 : 0.4;
    G.knockT = 0;
    G.jumpBuf = 0;
    G.fireEdge = true;
    G.subEdge = true;
    fillFx();
    syncHud();
  }

  function platUnder(x, y) {
    let best = null;
    let i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (x < p.x + 2 || x > p.x + p.w - 2) continue;
      if (y >= p.y - 6 && y <= p.y + 14) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }

  function landOn(x, y0, y1) {
    let best = null;
    let i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (x < p.x + 2 || x > p.x + p.w - 2) continue;
      if (y0 <= p.y + 3 && y1 >= p.y) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }

  function pitAhead(x, y, dir) {
    const nx = x + dir * 28;
    return !platUnder(nx, y);
  }

  function pBox() {
    const p = G.player;
    const h = p.h;
    return { x: p.x - p.w * 0.45, y: p.y - h, w: p.w * 0.9, h: h * 0.92 };
  }

  function swordBox() {
    if (G.swordT <= 0) return null;
    const p = G.player;
    const age = 1 - G.swordT / SWORD_T;
    if (age < 0.06 || age > 0.78) return null;
    const reach = SWORD_RANGE;
    const y = p.y - (p.duck ? 14 : 24);
    const x = p.face > 0 ? p.x + 4 : p.x - 4 - reach;
    return { x: x, y: y - 6, w: reach + 8, h: p.duck ? 14 : 22 };
  }

  function spawnPickup(x, y, kind) {
    G.pickups.push({
      x: x, y: y, kind: kind, vy: -80, t: 0, life: 8.5, taken: false
    });
  }

  function takePickup(u) {
    if (u.taken) return;
    u.taken = true;
    if (u.kind === 'hp') {
      G.hp = Math.min(maxHp(), G.hp + 4);
      toast('生命 +4', false, true);
    } else if (u.kind === 'nin') {
      G.ninpo = Math.min(NINPO_MAX, G.ninpo + 10);
      toast('忍 +10', false, false);
    } else if (u.kind === 'star' || u.kind === 'mill' || u.kind === 'fire') {
      G.sub = u.kind;
      G.ninpo = Math.min(NINPO_MAX, G.ninpo + 5);
      toast(SUB_NAME[u.kind], false, true);
    } else if (u.kind === 'life') {
      if (G.lives < LIFE_CAP) G.lives += 1;
      toast('1UP', false, true);
      audio.oneup();
    }
    audio.ping();
    juice(u.x, u.y, u.kind === 'fire' ? HOT : u.kind === 'mill' ? GOLD : CYN, 0.55);
    kick(1.6, 'pickup');
    if (hpBox) {
      hpBox.classList.remove('hurt');
      void hpBox.offsetWidth;
    }
    syncHud();
  }

  function breakLantern(c) {
    if (c.broken) return;
    c.broken = true;
    bumpCombo();
    const sc = SCORE.lantern * G.mult;
    addScore(sc);
    floatText(c.x, c.y, String(sc), GOLD, false);
    spawnPickup(c.x, c.y - 8, c.drop);
    juice(c.x, c.y, GOLD, 0.7);
    audio.hit(G.combo);
    hitStop(0.04);
  }

  function spawnShot(s) {
    s.id = uid++;
    G.shots.push(s);
  }

  function enemyShoot(e, dx, dy, spd, kind) {
    const mag = hypot(dx, dy) || 1;
    spawnShot({
      x: e.x, y: e.y - e.h * 0.55,
      vx: (dx / mag) * spd, vy: (dy / mag) * spd,
      kind: kind || 'knife', life: 2.4, dmg: 1,
      foe: true, rgb: MAG, spin: 0, w: 10, h: 6
    });
  }

  function trySlash() {
    if (G.swordT > 0) return;
    const p = G.player;
    if (!p || G.deadT > 0) return;
    G.swordT = SWORD_T;
    G.swordHit = {};
    p.pose = 0.16;
    if (playing()) audio.slash();
    const tip = p.x + p.face * 28;
    emit(5, {
      x: tip, y: p.y - (p.duck ? 10 : 18), j: 6,
      vx0: p.face * 40, vx1: p.face * 180, vy0: -80, vy1: 40,
      life: 0.16, r0: 1, r1: 2.2, rgb: CYN, g: 80
    });
  }

  function trySub() {
    if (G.subCd > 0 || G.deadT > 0) return;
    const p = G.player;
    if (!p) return;
    const kind = G.sub;
    if (!kind) {
      if (playing()) { toast('无忍术', true, false); audio.empty(); }
      return;
    }
    const cost = SUB_COST[kind] || 3;
    if (playing() && G.ninpo < cost) {
      toast('忍术不足', true, false);
      audio.empty();
      return;
    }
    if (playing()) G.ninpo -= cost;
    G.subCd = SUB_CD;
    G.ninFlash = 0.16;
    screenFlash(kind === 'fire' ? HOT : kind === 'mill' ? GOLD : CYN, 0.42);
    if (playing()) audio.sub(kind);
    syncHud();
    if (kind === 'star') {
      spawnShot({
        x: p.x + p.face * 10, y: p.y - 16,
        vx: p.face * 340, vy: 0,
        kind: 'star', life: 1.4, dmg: 1, foe: false,
        rgb: CYN, spin: 0, w: 12, h: 12, hit: {}
      });
    } else if (kind === 'mill') {
      spawnShot({
        x: p.x + p.face * 8, y: p.y - 16,
        vx: p.face * 220, vy: -20,
        kind: 'mill', life: 1.8, dmg: 1, foe: false,
        rgb: GOLD, spin: 0, w: 16, h: 16, hit: {},
        home: 0, face: p.face, max: 0.42
      });
    } else {
      spawnShot({
        x: p.x, y: p.y - 14,
        vx: 0, vy: 0,
        kind: 'fire', life: 1.7, dmg: 2, foe: false,
        rgb: HOT, spin: 0, w: 18, h: 18, hit: {}, ang: 0
      });
      spawnShot({
        x: p.x, y: p.y - 14,
        vx: 0, vy: 0,
        kind: 'fire', life: 1.7, dmg: 2, foe: false,
        rgb: ORG, spin: Math.PI, w: 18, h: 18, hit: {}, ang: Math.PI
      });
    }
    kick(1.8, 'pickup');
  }

  function hurt(srcX, dmg, why) {
    if (!playing() || G.invuln > 0 || G.deadT > 0) return;
    const p = G.player;
    G.hp -= dmg;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.invuln = INVULN;
    G.knockT = 0.22;
    p.cling = 0;
    p.wall = null;
    p.vx = (p.x < srcX ? -1 : 1) * 160;
    p.vy = -180;
    p.grounded = false;
    audio.hurt();
    juice(p.x, p.y - 12, MAG, 0.7);
    hitStop(0.06);
    kick(4.2, 'die');
    screenFlash(MAG, 0.4);
    if (hpBox) {
      hpBox.classList.remove('hurt');
      void hpBox.offsetWidth;
      hpBox.classList.add('hurt');
    }
    syncHud();
    if (G.hp <= 0) die(why || 'hit');
  }

  function die(why) {
    if (G.deadT > 0) return;
    G.why = why || 'hit';
    G.deadT = DIE_T;
    G.lives -= 1;
    G.hp = 0;
    G.combo = 0;
    G.mult = 1;
    const p = G.player;
    if (p) {
      p.cling = 0;
      p.vy = -220;
      p.vx = -p.face * 80;
    }
    audio.death();
    hitStop(0.072);
    kick(6.4, 'die');
    screenFlash(MAG, 0.55);
    syncHud();
  }

  function respawn() {
    const p = G.player;
    p.x = G.checkX;
    p.y = G.checkY;
    p.vx = 0;
    p.vy = 0;
    p.cling = 0;
    p.wall = null;
    p.grounded = true;
    p.duck = false;
    p.h = PH;
    G.hp = maxHp();
    G.invuln = INVULN;
    G.knockT = 0;
    G.deadT = 0;
    G.swordT = 0;
    toast('再起', false, false);
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    saveBest();
    const line = G.why === 'fall' ? '坠入深渊了' : G.why === 'boss' ? '被头目击倒了' : '生命耗尽了';
    showOverlay('lose', '影碎', line + ' · 分 ' + G.score);
    syncHud();
  }

  function goWin() {
    G.mode = 'win';
    audio.win();
    addScore(8000);
    saveBest();
    kick(3, 'win-flash');
    const title = isBlood() ? '血战得手' : '影已散';
    showOverlay('win', title, '夜城已破 · 分 ' + G.score + ' · 连击 ' + G.maxCombo);
    syncHud();
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    G.stage += 1;
    loadStage(G.stage, false);
    G.invuln = 0.8;
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'blood' ? 'blood' : 'city';
    G.mode = 'play';
    G.lives = LIVES;
    G.hp = maxHp();
    G.ninpo = NINPO_START;
    G.sub = 'star';
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.nextLife = LIFE_EVERY;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast(isBlood() ? '血战 · 生命减半' : '夜城', false, !isBlood());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'city';
    G.lives = LIVES;
    G.hp = HP_CITY;
    G.ninpo = NINPO_START;
    G.sub = 'star';
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    loadStage(1, true);
    showOverlay(
      'title',
      '影忍',
      '夜城走跳斩杀。贴墙滑落，再蹬出去。Z 挥刀，C 忍术耗忍。关底有头目。'
    );
    syncHud();
  }

  function restart() {
    if (G.mode === 'title') startGame('city');
    else startGame(G.kind);
  }

  function primaryAction() {
    if (G.mode === 'title') startGame('city');
    else if (G.mode === 'win' || G.mode === 'lose') startGame(G.kind);
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
    p.duck = false;
    p.h = PH;
    if (!was && playing()) {
      audio.cling();
      emit(5, {
        x: w.x, y: p.y - 12, j: 6,
        vx0: -dir * 20, vx1: -dir * 90, vy0: -40, vy1: 40,
        life: 0.18, r0: 1, r1: 2, rgb: HOT2, g: 80
      });
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
      hitStop(0.028);
      kick(2.4, 'wall');
      screenFlash(CYN, 0.16);
    }
  }

  function demoThink() {
    const p = G.player;
    demo.l = false;
    demo.r = true;
    demo.u = false;
    demo.fire = false;
    demo.sub = false;
    if (!p) return;
    if (p.cling) demo.u = true;
    else if (p.grounded) {
      if (pitAhead(p.x, p.y, 1) || wallProbe(p, 1) || (G.clock % 2.6) < 0.12) demo.u = true;
    }
    if ((G.clock * 1.7) % 1.15 < 0.16) demo.fire = true;
    if (p.x > 680) {
      G.player = makePlayer(56, GY);
      G.camX = 0;
    }
  }

  function updatePlayer(dt) {
    const p = G.player;
    if (!p) return;
    if (G.deadT > 0) {
      G.deadT -= dt;
      p.vy += GRAV * dt;
      p.y += p.vy * dt * 0.5;
      p.x += p.vx * dt;
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
    if (p.wallCool > 0) p.wallCool -= dt;

    if (G.knockT > 0) {
      G.knockT -= dt;
      p.cling = 0;
      p.duck = false;
      p.h = PH;
      p.x += p.vx * dt;
      p.x = clamp(p.x, 16, G.levelW - 16);
      p.vy += GRAV * dt;
      if (p.vy > MAX_FALL) p.vy = MAX_FALL;
      const y0k = p.y;
      let y1k = p.y + p.vy * dt;
      p.grounded = false;
      if (p.vy >= 0) {
        const plat = landOn(p.x, y0k, y1k);
        if (plat) {
          y1k = plat.y;
          p.vy = 0;
          p.grounded = true;
          p.vx *= 0.5;
        }
      }
      p.y = y1k;
      if (p.y > VH + 90) {
        if (playing()) die('fall');
        else {
          G.player = makePlayer(56, GY);
          G.camX = 0;
        }
      }
      p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
      return;
    }

    if (p.cling) {
      p.duck = false;
      p.h = PH;
      const w = p.wall;
      if (inD() || !w || p.y - 8 > w.y1 || p.y - p.h < w.y0 - 8) {
        p.cling = 0;
        p.wall = null;
        p.wallCool = 0.08;
      } else {
        p.x = w.x - p.cling * (p.w * 0.5 + 1.5);
        p.vx = 0;
        p.vy = WALL_SLIDE;
        p.y += p.vy * dt;
        p.face = p.cling;
        p.grounded = false;
        if (G.jumpBuf > 0) doWallJump(p);
        if (p.cling) {
          const plat = landOn(p.x, p.y - 4, p.y + 2);
          if (plat) {
            p.y = plat.y;
            p.vy = 0;
            p.grounded = true;
            p.cling = 0;
            p.wall = null;
          }
        }
      }
    }

    if (!p.cling) {
      let ax = 0;
      if (inL()) ax -= 1;
      if (inR()) ax += 1;
      p.duck = !!(p.grounded && inD() && !inU());
      p.h = p.duck ? 14 : PH;
      if (ax) p.face = ax;
      if (p.grounded) {
        p.vx = (p.duck ? ax * 40 : ax * WALK);
      } else if (ax && p.wallCool <= 0) {
        p.vx = ax * WALK;
      }
      p.x += p.vx * dt;
      p.x = clamp(p.x, 16, G.levelW - 16);
      if (G.boss && G.boss.active && !G.boss.dead) {
        const minX = G.levelW - VW + 18;
        if (p.x < minX) p.x = minX;
      }

      const canJump = (p.grounded || p.coyote > 0) && !p.duck;
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
        hitStop(0.02);
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
        }
      }
      p.y = y1;
      if (p.grounded) p.coyote = COYOTE;
      else p.coyote -= dt;
      if (!p.grounded) tryCling(p);
    }

    if (p.y > VH + 90) {
      if (playing()) die('fall');
      else {
        G.player = makePlayer(56, GY);
        G.camX = 0;
      }
    }
    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
    if (p.grounded && Math.abs(p.vx) > 20) p.run += dt * 11;
    else p.run += dt * 2;
    if (p.pose > 0) p.pose -= dt;

    if (p.grounded && !p.cling && p.x > G.checkX + 80) {
      const ck = platUnder(p.x, p.y);
      if (ck && ck.base && p.x > ck.x + 36 && p.x < ck.x + ck.w - 36) {
        G.checkX = p.x;
        G.checkY = p.y;
      }
    }

    if (G.swordT > 0) G.swordT -= dt;
    if (G.subCd > 0) G.subCd -= dt;
    if (G.ninFlash > 0) G.ninFlash -= dt;

    const wantSlash = fireHeld();
    if (wantSlash && !G.fireEdge) trySlash();
    G.fireEdge = wantSlash;

    const wantSub = subHeld();
    if (wantSub && !G.subEdge) trySub();
    G.subEdge = wantSub;

    resolveSword();

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
      const plat = landOn(u.x, uy0, u.y);
      if (plat) {
        u.y = plat.y - 10;
        u.vy = 0;
      }
      if (u.life <= 0) u.taken = true;
      if (hypot(p.x - u.x, (p.y - 12) - u.y) < 18) takePickup(u);
    }

    if (G.invuln > 0) return;
    const pb = pBox();
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      if (overlap(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.45, e.y - e.h, e.w * 0.9, e.h * 0.92)) {
        hurt(e.x, e.kind === 'soldier' ? 2 : 1, 'hit');
        return;
      }
    }
    if (G.boss && !G.boss.dead && G.boss.active) {
      const b = G.boss;
      if (overlap(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.4, b.y - b.h, b.w * 0.8, b.h * 0.9)) {
        hurt(b.x, 2, 'boss');
      }
    }
  }

  function hitEnemy(e, dmg, src) {
    if (e.dead) return;
    e.hp -= dmg;
    e.hitN = 0.1;
    const cx = e.x;
    const cy = e.y - e.h * 0.5;
    const kb = (G.player && G.player.x < e.x ? 1 : -1);
    e.x += kb * (src === 'sword' ? 10 : 6);
    if (e.hp <= 0) {
      e.dead = true;
      bumpCombo();
      const sc = (SCORE[e.kind] || 100) * G.mult;
      addScore(sc);
      floatText(cx, cy, String(sc), GOLD, e.kind === 'soldier');
      audio.hit(G.combo);
      juice(cx, cy, e.kind === 'bird' ? CYN : e.kind === 'dog' ? ORG : HOT, e.kind === 'soldier' ? 0.95 : 0.7);
      hitStop(e.kind === 'soldier' ? 0.062 : 0.048);
    } else {
      audio.slash();
      emit(6, {
        x: cx, y: cy, j: 5,
        vx0: -120, vx1: 120, vy0: -180, vy1: -20,
        life: 0.2, r0: 1, r1: 2.4, rgb: src === 'sword' ? CYN : GOLD
      });
      hitStop(0.036);
    }
  }

  function resolveSword() {
    const box = swordBox();
    if (!box) return;
    let i, c, e;
    for (i = 0; i < G.lanterns.length; i++) {
      c = G.lanterns[i];
      if (c.broken) continue;
      if (G.swordHit['L' + i]) continue;
      if (overlap(box.x, box.y, box.w, box.h, c.x - 8, c.y - 16, 16, 22)) {
        G.swordHit['L' + i] = 1;
        breakLantern(c);
      }
    }
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      if (G.swordHit[e.id]) continue;
      if (overlap(box.x, box.y, box.w, box.h, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) {
        G.swordHit[e.id] = 1;
        hitEnemy(e, 1, 'sword');
      }
    }
    if (G.boss && !G.boss.dead && G.boss.active && !G.swordHit[G.boss.id]) {
      const b = G.boss;
      if (overlap(box.x, box.y, box.w, box.h, b.x - b.w * 0.45, b.y - b.h, b.w * 0.9, b.h)) {
        G.swordHit[b.id] = 1;
        hitBoss(1);
      }
    }
    for (i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (!s.foe) continue;
      if (overlap(box.x, box.y, box.w, box.h, s.x - 6, s.y - 6, 12, 12)) {
        s.life = 0;
        emit(4, {
          x: s.x, y: s.y, j: 4,
          vx0: -80, vx1: 80, vy0: -80, vy1: 20,
          life: 0.16, r0: 1, r1: 2, rgb: CYN, g: 60
        });
      }
    }
  }

  function hitBoss(dmg) {
    const b = G.boss;
    if (!b || b.dead || !b.active) return;
    b.hp -= dmg;
    b.hitN = 0.1;
    const cx = b.x;
    const cy = b.y - b.h * 0.5;
    if (b.hp <= 0) {
      b.dead = true;
      b.active = false;
      bumpCombo();
      const sc = SCORE.boss * G.mult * G.stage;
      addScore(sc);
      addScore(SCORE.stage * G.stage);
      floatText(cx, cy - 10, String(sc), GOLD, true);
      audio.boom();
      juice(cx, cy, GOLD, 1.6);
      hitStop(0.078);
      kick(5.5, 'boom');
      G.clearT = 1.35;
      toast(b.name + ' 已斩', false, true);
    } else {
      audio.hit(G.combo);
      juice(cx, cy, HOT, 0.55);
      hitStop(0.07);
      floatText(cx, cy, String(80 * G.mult), GOLD, false);
      addScore(80 * G.mult);
    }
  }

  function onScreen(x, y, pad) {
    const m = pad || 24;
    return x > G.camX - m && x < G.camX + VW + m && y > -40 && y < VH + 40;
  }

  function spawnBird() {
    const side = Math.random() < 0.5 ? 0 : 1;
    const x = G.camX + (side ? VW + 20 : -20);
    const y = 70 + rand(0, 90);
    const e = makeEnt(x, y, 'bird', x - 80, x + 80);
    e.base = y;
    G.ents.push(e);
  }

  function spawnDog() {
    const p = G.player;
    const right = p && p.face > 0;
    const x = G.camX + (right ? VW + 24 : -24);
    const plat = platUnder(x, GY) || platUnder(clamp(x, G.camX + 40, G.camX + VW - 40), GY);
    if (!plat) return;
    const e = makeEnt(x, GY, 'dog', plat.x, plat.x + plat.w);
    G.ents.push(e);
  }

  function updateSpawns(dt) {
    if (!playing() || G.deadT > 0) return;
    if (G.boss && G.boss.active && !G.boss.dead) return;
    G.spawnT -= dt;
    const wait = (isBlood() ? 0.7 : 0.95) / (1 + (G.stage - 1) * 0.14);
    if (G.spawnT > 0) return;
    G.spawnT = wait + rand(0, 0.25);
    let birds = 0;
    let dogs = 0;
    let i, e;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      if (!onScreen(e.x, e.y, 80)) continue;
      if (e.kind === 'bird') birds += 1;
      if (e.kind === 'dog') dogs += 1;
    }
    const maxBird = 3 + G.stage + (isBlood() ? 1 : 0);
    const maxDog = G.stage + (isBlood() ? 1 : 0);
    if (birds < maxBird) spawnBird();
    else if (dogs < maxDog) spawnDog();
    if (G.ents.length > 72) {
      G.ents = G.ents.filter(function (en) {
        return !en.dead || onScreen(en.x, en.y, 80);
      });
    }
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    if (e.hitN > 0) e.hitN -= dt;
    e.t += dt;
    const p = G.player;
    const sp = spdMul(isBlood(), G.stage);
    if (e.kind === 'bird') {
      if (p) e.face = p.x >= e.x ? 1 : -1;
      e.vx = e.face * 78 * sp;
      e.x += e.vx * dt;
      e.y = e.base + Math.sin(e.t * 3.4) * 16;
      if (p) e.base += clamp((p.y - 90) - e.base, -40, 40) * dt * 0.35;
      if (e.y > GY - 8) e.y = GY - 8;
    } else if (e.kind === 'dog') {
      if (p && Math.abs(p.x - e.x) < 280) e.face = p.x >= e.x ? 1 : -1;
      e.vx = e.face * 168 * sp;
      e.x += e.vx * dt;
      e.vy += GRAV * dt;
      if (e.vy > MAX_FALL) e.vy = MAX_FALL;
      const y0 = e.y;
      e.y += e.vy * dt;
      const plat = landOn(e.x, y0, e.y);
      if (plat) {
        e.y = plat.y;
        e.vy = 0;
      } else if (e.y > VH + 40) {
        e.dead = true;
      }
    } else {
      if (p && Math.abs(p.x - e.x) < 220 && Math.abs(p.y - e.y) < 40) {
        e.face = p.x >= e.x ? 1 : -1;
      } else if (e.x < e.a) e.face = 1;
      else if (e.x > e.b) e.face = -1;
      e.vx = e.face * 58 * sp;
      e.x += e.vx * dt;
      e.vy += GRAV * dt;
      const y0 = e.y;
      e.y += e.vy * dt;
      const plat = landOn(e.x, y0, e.y);
      if (plat) {
        e.y = plat.y;
        e.vy = 0;
      } else if (e.y > VH + 40) e.dead = true;
      e.fire -= dt;
      if (playing() && e.fire <= 0 && p && onScreen(e.x, e.y, 10) && Math.abs(p.y - e.y) < 50) {
        e.fire = isBlood() ? 1.15 : 1.55;
        enemyShoot(e, e.face, -0.08, 180 * sp, 'knife');
      }
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    const p = G.player;
    if (!b.active) {
      if (p && p.x > G.levelW - VW + 80) {
        b.active = true;
        audio.boss();
        toast(b.name, false, true);
        kick(3.2, 'boom');
        screenFlash(HOT, 0.3);
      }
      return;
    }
    if (b.hitN > 0) b.hitN -= dt;
    b.t += dt;
    b.fire -= dt;
    const sp = spdMul(isBlood(), G.stage);
    if (p) b.face = p.x >= b.x ? 1 : -1;

    if (b.kind === '蛮将') {
      b.vx = b.face * 70 * sp;
      if (b.state === 'wait') {
        if (b.t > 0.5) { b.state = 'walk'; b.t = 0; }
      } else if (b.state === 'walk') {
        b.x += b.vx * dt;
        if (b.t > 1.1 || (p && Math.abs(p.x - b.x) < 50)) {
          b.state = 'slash';
          b.t = 0;
        }
      } else {
        b.vx = 0;
        if (b.t > 0.18 && b.t < 0.22 && p && Math.abs(p.x - b.x) < 58 && Math.abs(p.y - b.y) < 36) {
          hurt(b.x, 2, 'boss');
        }
        if (b.t > 0.55) { b.state = 'walk'; b.t = 0; }
      }
    } else if (b.kind === '铁拳') {
      if (b.state === 'wait') {
        if (b.t > 0.35) { b.state = 'jump'; b.t = 0; b.vy = -420; b.vx = b.face * 140; }
      } else if (b.state === 'jump') {
        b.vy += GRAV * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.y >= GY) {
          b.y = GY;
          b.vy = 0;
          b.state = 'slam';
          b.t = 0;
          kick(4, 'thump');
          audio.boom();
          emit(14, {
            x: b.x, y: b.y, j: 16,
            vx0: -180, vx1: 180, vy0: -160, vy1: -20,
            life: 0.32, r0: 1.4, r1: 3.2, rgb: HOT, g: 280
          });
          if (p && p.grounded && Math.abs(p.x - b.x) < 90) hurt(b.x, 2, 'boss');
        }
      } else {
        if (b.t > 0.45) { b.state = 'wait'; b.t = 0; }
      }
    } else {
      b.y = GY - 18 - Math.sin(G.clock * 2.2) * 10;
      if (b.state === 'wait') {
        if (b.t > 0.55) {
          b.state = Math.random() < 0.4 ? 'warp' : 'shot';
          b.t = 0;
        }
      } else if (b.state === 'warp') {
        if (b.t > 0.2) {
          b.x = clamp((p ? p.x : b.x) + (Math.random() < 0.5 ? 140 : -140), G.levelW - VW + 40, G.levelW - 40);
          b.state = 'shot';
          b.t = 0;
          popSpark(b.x, b.y - 20, MAG, 18);
        }
      } else {
        if (b.fire <= 0) {
          b.fire = isBlood() ? 0.42 : 0.58;
          const ang = p ? Math.atan2((p.y - 16) - (b.y - 24), p.x - b.x) : Math.PI;
          spawnShot({
            x: b.x, y: b.y - 24,
            vx: Math.cos(ang) * 170, vy: Math.sin(ang) * 170,
            kind: 'fireball', life: 2.2, dmg: 2, foe: true,
            rgb: HOT, spin: 0, w: 12, h: 12
          });
        }
        if (b.t > 1.15) { b.state = 'wait'; b.t = 0; }
      }
    }

    b.x = clamp(b.x, G.levelW - VW + 30, G.levelW - 24);
    if (b.kind === '蛮将' || (b.kind === '铁拳' && b.state !== 'jump')) {
      if (b.y < GY) {
        b.vy += GRAV * dt;
        b.y += b.vy * dt;
        if (b.y > GY) { b.y = GY; b.vy = 0; }
      }
    }
  }

  function shotHits(s, x, y, w, h) {
    return overlap(s.x - s.w * 0.5, s.y - s.h * 0.5, s.w, s.h, x, y, w, h);
  }

  function updateShots(dt) {
    const p = G.player;
    let i, s, k, e;
    for (i = G.shots.length - 1; i >= 0; i--) {
      s = G.shots[i];
      s.life -= dt;
      s.spin += dt * (s.kind === 'mill' ? 14 : 10);
      if (s.kind === 'fire' && p) {
        s.ang += dt * 9;
        s.x = p.x + Math.cos(s.ang + s.spin) * 30;
        s.y = p.y - 14 + Math.sin(s.ang + s.spin) * 18;
      } else if (s.kind === 'mill') {
        s.home += dt;
        if (s.home > s.max && p) {
          const dx = p.x - s.x;
          const dy = (p.y - 16) - s.y;
          const m = hypot(dx, dy) || 1;
          s.vx = (dx / m) * 240;
          s.vy = (dy / m) * 240;
          if (m < 16) s.life = 0;
        }
        s.x += s.vx * dt;
        s.y += s.vy * dt;
      } else {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
      }
      if (s.life <= 0 || s.x < G.camX - 40 || s.x > G.camX + VW + 40 || s.y < -30 || s.y > VH + 40) {
        G.shots.splice(i, 1);
        continue;
      }
      if (s.foe) {
        if (playing() && G.deadT <= 0 && G.invuln <= 0 && p) {
          const pb = pBox();
          if (shotHits(s, pb.x, pb.y, pb.w, pb.h)) {
            hurt(s.x, s.dmg || 1, 'hit');
            G.shots.splice(i, 1);
          }
        }
        continue;
      }
      if (!s.hit) s.hit = {};
      for (k = 0; k < G.lanterns.length; k++) {
        const c = G.lanterns[k];
        if (c.broken || s.hit['L' + k]) continue;
        if (shotHits(s, c.x - 8, c.y - 16, 16, 22)) {
          s.hit['L' + k] = 1;
          breakLantern(c);
          if (s.kind === 'star') s.life = 0;
        }
      }
      for (k = 0; k < G.ents.length; k++) {
        e = G.ents[k];
        if (e.dead || s.hit[e.id]) continue;
        if (shotHits(s, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) {
          s.hit[e.id] = 1;
          hitEnemy(e, s.dmg || 1, s.kind);
          if (s.kind === 'star') s.life = 0;
        }
      }
      if (G.boss && !G.boss.dead && G.boss.active && !s.hit[G.boss.id]) {
        const b = G.boss;
        if (shotHits(s, b.x - b.w * 0.45, b.y - b.h, b.w * 0.9, b.h)) {
          s.hit[b.id] = 1;
          hitBoss(s.dmg || 1);
          if (s.kind === 'star') s.life = 0;
        }
      }
    }
  }

  function updateCam(dt) {
    const p = G.player;
    let target = 0;
    if (G.boss && G.boss.active && !G.boss.dead) {
      target = G.levelW - VW;
    } else if (p) {
      target = p.x - VW * 0.38;
    }
    target = clamp(target, 0, Math.max(0, G.levelW - VW));
    G.camX = lerp(G.camX, target, 1 - Math.pow(0.0008, dt));
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.ninFlash > 0) G.ninFlash = Math.max(0, G.ninFlash - dt);
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
    for (i = 0; i < mist.length; i++) {
      mist[i].x += mist[i].vx * dt;
      if (mist[i].x > G.camX + VW + 40) mist[i].x = G.camX - 40;
    }
    for (i = 0; i < rain.length; i++) {
      o = rain[i];
      o.y += o.vy * dt;
      o.x += 40 * dt;
      if (o.y > VH + 10) {
        o.y = -10;
        o.x = G.camX + rand(-20, VW + 20);
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
    if (G.invuln > 0) G.invuln -= dt;
  }

  function update(dt) {
    G.clock += dt;
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
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
    updateSpawns(dt);
    for (i = 0; i < G.lanterns.length; i++) G.lanterns[i].t += dt;
    updateCam(dt);
    updateFx(dt);
  }

  function drawSky() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (spec.theme === 'hall') {
      g.addColorStop(0, '#1a0610');
      g.addColorStop(0.55, '#14040c');
      g.addColorStop(1, '#0c0306');
    } else if (spec.theme === 'tower') {
      g.addColorStop(0, '#12060c');
      g.addColorStop(0.5, '#16080e');
      g.addColorStop(1, '#0c0408');
    } else {
      g.addColorStop(0, '#14060a');
      g.addColorStop(0.5, '#18080c');
      g.addColorStop(1, '#0c0406');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const mx = sx(G.camX + VW * 0.78);
    const my = sy(G.camY + 42);
    ctx.fillStyle = rgba(GOLD, isBlood() ? 0.28 : 0.5);
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
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const par = G.camX * 0.28;
    const base = sy(GY + 6);
    let i, x, h, w, win;
    for (i = -2; i < 26; i++) {
      x = sx((Math.floor((G.camX + par) / 72) + i) * 72 - par);
      h = (70 + hash2(i + 17 + G.stage * 9) * 110) * scale;
      w = (36 + hash2(i + 5) * 22) * scale;
      ctx.fillStyle = i % 2 ? '#16080a' : '#100406';
      ctx.fillRect(x, base - h, w, h + 40 * scale);
      ctx.fillStyle = rgba(HOT, 0.16);
      ctx.fillRect(x, base - h, w, 3 * scale);
      win = hash2(i + 3);
      ctx.fillStyle = win > 0.55 ? rgba(GOLD, 0.32) : rgba(CYN, 0.14);
      ctx.fillRect(x + 8 * scale, base - h + 16 * scale, 6 * scale, 8 * scale);
      ctx.fillRect(x + 20 * scale, base - h + 32 * scale, 6 * scale, 8 * scale);
      if (spec.theme === 'tower') {
        ctx.fillStyle = '#1a0a10';
        ctx.fillRect(x + w * 0.3, base - h - 16 * scale, w * 0.4, 16 * scale);
      }
      if (spec.theme === 'hall') {
        ctx.fillStyle = rgba(MAG, 0.18);
        ctx.fillRect(x + 4 * scale, base - h + 8 * scale, w - 8 * scale, 2 * scale);
      }
    }
    for (i = 0; i < mist.length; i++) {
      const m = mist[i];
      ctx.fillStyle = rgba(isBlood() ? MAG : HOT2, m.a);
      ctx.beginPath();
      ctx.arc(sx(m.x), sy(m.y), m.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawAbyss() {
    const bases = G.plats.filter(function (p) { return p.base; });
    const y = sy(GY + 8);
    ctx.fillStyle = rgba(MAG, 0.08);
    ctx.fillRect(sx(G.camX - 10), y, (VW + 20) * scale, 50 * scale);
    let x, covered, i;
    for (x = G.camX; x < G.camX + VW; x += 16) {
      covered = false;
      for (i = 0; i < bases.length; i++) {
        if (x >= bases[i].x && x <= bases[i].x + bases[i].w) covered = true;
      }
      if (covered) continue;
      ctx.fillStyle = rgba(HOT, 0.12 + Math.sin(x * 0.1 + G.clock * 4) * 0.04);
      ctx.fillRect(sx(x), sy(GY + 2), 14 * scale, 10 * scale);
    }
  }

  function drawPlats() {
    let i, p, x, y, w, h, k, n;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      x = sx(p.x);
      y = sy(p.y);
      w = p.w * scale;
      h = p.h * scale;
      ctx.fillStyle = p.base ? '#1a0a0c' : '#221014';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = rgba(HOT, p.base ? 0.85 : 0.7);
      ctx.fillRect(x, y, w, 2.4 * scale);
      ctx.fillStyle = rgba(GOLD, 0.22);
      ctx.fillRect(x + 2 * scale, y + 2.4 * scale, w - 4 * scale, 1.2 * scale);
      if (p.base) {
        n = Math.max(2, (p.w / 28) | 0);
        for (k = 0; k <= n; k++) {
          ctx.fillStyle = k % 2 ? rgba(HOT, 0.2) : rgba(CYN, 0.1);
          ctx.fillRect(x + (k / n) * w, y, 2 * scale, 6 * scale);
        }
      }
    }
  }

  function drawWalls() {
    let i, w, x, y0, y1;
    for (i = 0; i < G.walls.length; i++) {
      w = G.walls[i];
      x = sx(w.x);
      y0 = sy(w.y0);
      y1 = sy(w.y1);
      ctx.fillStyle = rgba(HOT, 0.55);
      ctx.fillRect(x - 2 * scale, y0, 4 * scale, y1 - y0);
      ctx.fillStyle = rgba(CYN, 0.22);
      ctx.fillRect(x - 1 * scale, y0, 2 * scale, y1 - y0);
    }
  }

  function drawLantern(c) {
    if (c.broken) return;
    const x = sx(c.x);
    const y = sy(c.y);
    const s = scale;
    const flick = 0.7 + Math.sin(c.t * 9 + c.x) * 0.3;
    ctx.strokeStyle = rgba(STN, 0.7);
    ctx.lineWidth = 1.2 * s;
    ctx.beginPath();
    ctx.moveTo(x, y - 18 * s);
    ctx.lineTo(x, y - 10 * s);
    ctx.stroke();
    ctx.fillStyle = rgba(HOT, 0.22 * flick);
    ctx.beginPath();
    ctx.arc(x, y, 11 * s * flick, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT2, 0.92);
    ctx.beginPath();
    ctx.ellipse(x, y - 2 * s, 6 * s, 8 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.85 * flick);
    ctx.fillRect(x - 3 * s, y - 6 * s, 6 * s, 6 * s);
    ctx.fillStyle = rgba(WHT, 0.55);
    ctx.fillRect(x - 1 * s, y - 4 * s, 2 * s, 3 * s);
  }

  function drawPickup(u) {
    if (u.taken) return;
    const x = sx(u.x);
    const y = sy(u.y + Math.sin(G.clock * 5 + u.t) * 2);
    const s = scale;
    let rgb = CYN;
    let mark = '忍';
    if (u.kind === 'hp') { rgb = HOT; mark = '命'; }
    else if (u.kind === 'star') { rgb = CYN; mark = '剑'; }
    else if (u.kind === 'mill') { rgb = GOLD; mark = '风'; }
    else if (u.kind === 'fire') { rgb = HOT2; mark = '炎'; }
    else if (u.kind === 'life') { rgb = LEAF; mark = '命'; }
    ctx.fillStyle = rgba(rgb, 0.2);
    ctx.beginPath();
    ctx.arc(x, y, 10 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.fillRect(x - 7 * s, y - 7 * s, 14 * s, 14 * s);
    ctx.strokeStyle = rgba(WHT, 0.65);
    ctx.lineWidth = 1.1 * s;
    ctx.strokeRect(x - 7 * s, y - 7 * s, 14 * s, 14 * s);
    ctx.fillStyle = '#140808';
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
    ctx.rotate(s.spin || 0);
    if (s.kind === 'fire' || s.kind === 'fireball') {
      ctx.fillStyle = rgba(HOT, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, 6 * sc, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(-1 * sc, -1 * sc, 2.6 * sc, 0, TAU);
      ctx.fill();
    } else if (s.kind === 'mill') {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -8 * sc);
      ctx.lineTo(2.4 * sc, -2 * sc);
      ctx.lineTo(8 * sc, 0);
      ctx.lineTo(2.4 * sc, 2 * sc);
      ctx.lineTo(0, 8 * sc);
      ctx.lineTo(-2.4 * sc, 2 * sc);
      ctx.lineTo(-8 * sc, 0);
      ctx.lineTo(-2.4 * sc, -2 * sc);
      ctx.closePath();
      ctx.fill();
    } else if (s.kind === 'star') {
      ctx.fillStyle = rgba(CYN, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -5 * sc);
      ctx.lineTo(1.6 * sc, -1.2 * sc);
      ctx.lineTo(5 * sc, 0);
      ctx.lineTo(1.6 * sc, 1.2 * sc);
      ctx.lineTo(0, 5 * sc);
      ctx.lineTo(-1.6 * sc, 1.2 * sc);
      ctx.lineTo(-5 * sc, 0);
      ctx.lineTo(-1.6 * sc, -1.2 * sc);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(s.rgb || MAG, 0.95);
      ctx.fillRect(-5 * sc, -1.6 * sc, 11 * sc, 3.2 * sc);
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.fillRect(2 * sc, -0.8 * sc, 4 * sc, 1.6 * sc);
    }
    ctx.restore();
  }

  function drawSword(p) {
    if (G.swordT <= 0) return;
    const age = 1 - G.swordT / SWORD_T;
    const reach = SWORD_RANGE * (age < 0.18 ? age / 0.18 : age > 0.82 ? (1 - age) / 0.18 : 1);
    const y = p.y - (p.duck ? 10 : 18);
    const x0 = p.x + p.face * 6;
    const x1 = p.x + p.face * (8 + reach);
    const lift = Math.sin(age * Math.PI) * 10;
    ctx.save();
    ctx.strokeStyle = rgba(CYN, 0.95);
    ctx.lineWidth = 2.4 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx(x0), sy(y));
    ctx.quadraticCurveTo(sx((x0 + x1) * 0.5), sy(y - lift - 6), sx(x1), sy(y - lift * 0.2));
    ctx.stroke();
    ctx.strokeStyle = rgba(WHT, 0.75);
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(x0), sy(y));
    ctx.quadraticCurveTo(sx((x0 + x1) * 0.5), sy(y - lift - 4), sx(x1), sy(y - lift * 0.2));
    ctx.stroke();
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.beginPath();
    ctx.arc(sx(x1), sy(y - lift * 0.2), 2.4 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawHero(p, opt) {
    if (opt.blink && ((G.t * 18) | 0) % 2 === 0) return;
    const s = scale;
    const sq = opt.squash || 1;
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.scale(p.face * (p.cling ? 0.92 : 1), sq);
    if (p.cling) ctx.rotate(-0.18);
    const duck = opt.duck;
    const bodyH = duck ? 11 : 15;
    const leg = Math.sin(opt.run || 0) * (duck ? 1 : 5) * s;
    ctx.strokeStyle = rgba(HOT2, 0.95);
    ctx.lineWidth = 2.1 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3 * s, -6 * s);
    ctx.lineTo(-4 * s + (opt.grounded && !p.cling ? -leg : 2 * s), 0);
    ctx.moveTo(3 * s, -6 * s);
    ctx.lineTo(4 * s + (opt.grounded && !p.cling ? leg : -2 * s), 0);
    ctx.stroke();
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.fillRect(-6.2 * s, -bodyH * s - 5 * s, 12.4 * s, bodyH * s);
    ctx.fillStyle = rgba(GOLD, 0.7);
    ctx.fillRect(-6.2 * s, -bodyH * s + 2 * s, 12.4 * s, 2.2 * s);
    ctx.fillStyle = rgba(SKIN, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -(bodyH + 11) * s, 5 * s, 5.2 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#140808';
    ctx.fillRect(-5 * s, -(bodyH + 16) * s, 10 * s, 4 * s);
    ctx.fillStyle = rgba(WHT, 0.92);
    ctx.fillRect(-5.2 * s, -(bodyH + 13.2) * s, 10.4 * s, 1.8 * s);
    ctx.fillStyle = '#1a0a10';
    ctx.fillRect(1.2 * s, -(bodyH + 12) * s, 3 * s, 1.5 * s);
    const slashOn = G.swordT > 0;
    ctx.strokeStyle = rgba(CYN, 0.9);
    ctx.lineWidth = 1.7 * s;
    ctx.beginPath();
    ctx.moveTo(4 * s, -(bodyH + 1) * s);
    ctx.lineTo((slashOn ? 16 : 9) * s, -(bodyH + (slashOn ? 4 : 1)) * s);
    ctx.stroke();
    if (p.cling) {
      ctx.strokeStyle = rgba(WHT, 0.7);
      ctx.beginPath();
      ctx.moveTo(6 * s, -(bodyH - 2) * s);
      ctx.lineTo(12 * s, -(bodyH + 4) * s);
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
    if (e.kind === 'bird') {
      const flap = Math.sin(e.t * 14) * 7;
      ctx.fillStyle = rgba(STN, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, -6 * s, 5 * s, 3.4 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT2, 0.8);
      ctx.beginPath();
      ctx.moveTo(0, -6 * s);
      ctx.lineTo(-13 * s, (-8 - flap) * s);
      ctx.lineTo(-2 * s, -3 * s);
      ctx.moveTo(0, -6 * s);
      ctx.lineTo(13 * s, (-8 + flap) * s);
      ctx.lineTo(2 * s, -3 * s);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(3 * s, -7 * s, 5 * s, 1.6 * s);
    } else if (e.kind === 'dog') {
      const stretch = Math.sin(e.t * 14) * 2 * s;
      ctx.fillStyle = rgba(ORG, 0.92);
      ctx.fillRect(-9 * s, -10 * s, 16 * s, 8 * s);
      ctx.beginPath();
      ctx.ellipse(8 * s, -12 * s, 5 * s, 4.2 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#140808';
      ctx.fillRect(9 * s, -13 * s, 2.2 * s, 1.6 * s);
      ctx.fillStyle = rgba(HOT2, 0.8);
      ctx.fillRect(-8 * s + stretch, -4 * s, 4 * s, 4 * s);
      ctx.fillRect(2 * s - stretch, -4 * s, 4 * s, 4 * s);
    } else {
      const wob = Math.sin(e.t * 6) * 1.4 * s;
      ctx.fillStyle = rgba(STN, 0.92);
      ctx.fillRect(-6 * s + wob * 0.15, -20 * s, 12 * s, 16 * s);
      ctx.fillStyle = rgba(HOT, 0.7);
      ctx.fillRect(-6 * s, -20 * s, 12 * s, 3 * s);
      ctx.fillStyle = rgba(SKIN, 0.95);
      ctx.beginPath();
      ctx.arc(wob * 0.1, -24 * s, 4.6 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#140808';
      ctx.fillRect(-4 * s, -28 * s, 8 * s, 3 * s);
      ctx.strokeStyle = rgba(GOLD, 0.8);
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath();
      ctx.moveTo(6 * s, -16 * s);
      ctx.lineTo(12 * s, -10 * s);
      ctx.stroke();
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
    if (b.kind === '蛮将') {
      ctx.fillStyle = rgba(HOT, 0.92);
      ctx.fillRect(-14 * s, -36 * s, 28 * s, 36 * s);
      ctx.fillStyle = rgba(GOLD, 0.5);
      ctx.fillRect(-14 * s, -36 * s, 28 * s, 5 * s);
      ctx.fillStyle = rgba(SKIN, 0.95);
      ctx.beginPath();
      ctx.arc(0, -44 * s, 8 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#140808';
      ctx.fillRect(-8 * s, -52 * s, 16 * s, 5 * s);
      ctx.fillStyle = rgba(STN, 0.9);
      ctx.fillRect(10 * s, -28 * s, 8 * s, 18 * s);
    } else if (b.kind === '铁拳') {
      ctx.fillStyle = rgba(STN, 0.95);
      ctx.fillRect(-16 * s, -34 * s, 32 * s, 34 * s);
      ctx.fillStyle = rgba(HOT, 0.55);
      ctx.fillRect(-16 * s, -34 * s, 32 * s, 6 * s);
      ctx.fillStyle = rgba(SKIN, 0.9);
      ctx.beginPath();
      ctx.arc(0, -42 * s, 9 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT2, 0.9);
      ctx.fillRect(10 * s, -24 * s, 12 * s, 12 * s);
      ctx.fillRect(-22 * s, -24 * s, 12 * s, 12 * s);
    } else {
      ctx.fillStyle = rgba(MAG, 0.88);
      ctx.beginPath();
      ctx.moveTo(-4 * s, -8 * s);
      ctx.lineTo(-20 * s, -16 * s);
      ctx.lineTo(-8 * s, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1a0814';
      ctx.fillRect(-11 * s, -36 * s, 22 * s, 28 * s);
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.fillRect(-11 * s, -36 * s, 22 * s, 4 * s);
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.beginPath();
      ctx.arc(0, -44 * s, 8 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.7);
      ctx.fillRect(-7 * s, -54 * s, 14 * s, 5 * s);
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
    ctx.fillStyle = rgba(HOT, 0.92);
    ctx.fillRect(x, y, w * clamp(b.hp / b.max, 0, 1), 8 * scale);
    ctx.strokeStyle = rgba(GOLD, 0.55);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.font = 'bold ' + (11 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
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
    if (isBlood()) {
      ctx.strokeStyle = 'rgba(255,80,90,0.28)';
      ctx.lineWidth = 1;
      for (i = 0; i < rain.length; i++) {
        o = rain[i];
        ctx.beginPath();
        ctx.moveTo(sx(o.x), sy(o.y));
        ctx.lineTo(sx(o.x + 3), sy(o.y + o.l));
        ctx.stroke();
      }
    }
    if (G.ninFlash > 0) {
      ctx.fillStyle = rgba(CYN, G.ninFlash * 0.5);
      ctx.fillRect(ox, oy, VW * scale, VH * scale);
    }
  }

  function draw() {
    dpr = dpr || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0a0302';
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
    drawWalls();

    let i;
    for (i = 0; i < G.lanterns.length; i++) drawLantern(G.lanterns[i]);
    for (i = 0; i < G.pickups.length; i++) drawPickup(G.pickups[i]);
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawBoss();
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);

    const p = G.player;
    if (p && G.deadT <= 0) {
      const blink = playing() && G.invuln > 0;
      drawHero(p, {
        run: p.run, grounded: p.grounded && !p.cling,
        squash: p.squash, duck: p.duck, blink: blink
      });
      drawSword(p);
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
    const slashk = k === 'z' || k === 'Z';
    const subk = k === 'c' || k === 'C' || k === 'x' || k === 'X';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up' || space) keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (slashk) keys.fire = down;
    if (subk) keys.sub = down;

    if (down && (isMove || space || k === 'Enter' || slashk || subk)) e.preventDefault();
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
      startGame('city');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('blood');
      return;
    }
    if (space || k === 'Enter' || slashk) {
      if (overlayOpen()) {
        primaryAction();
        if (slashk) keys.fire = false;
        if (space) keys.u = false;
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
    hold(document.getElementById('btn-slash'), function () { keys.fire = true; }, function () { keys.fire = false; });
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

  if (btnCity) {
    btnCity.addEventListener('click', function () {
      audio.ensure();
      startGame('city');
    });
  }
  if (btnBlood) {
    btnBlood.addEventListener('click', function () {
      audio.ensure();
      startGame('blood');
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
      if (G.mode === 'win') startGame('blood');
      else goTitle();
    });
  }
  if (modeCity) {
    modeCity.addEventListener('click', function () {
      audio.ensure();
      startGame('city');
    });
  }
  if (modeBlood) {
    modeBlood.addEventListener('click', function () {
      audio.ensure();
      startGame('blood');
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
      keys.sub = false;
    }
  });

  requestAnimationFrame(frame);
})();
