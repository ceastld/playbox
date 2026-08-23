'use strict';

(function () {
  const VW = 640;
  const VH = 360;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 15000;
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
  const INVULN = 1.22;
  const INVULN_CORE = 0.92;
  const DIE_T = 0.82;
  const CYCLE = 32;
  const BEST_KEY = 'playbox-castlevania2-best';
  const MUTE_KEY = 'playbox-castlevania2-mute';
  const OPS = '方向键 / WASD 走跳 · 空格挥鞭 · Shift/Z 副武器 · R 重开 · M 静音';

  const MAG = [255, 61, 120];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [122, 92, 255];
  const HOT2 = [168, 152, 255];
  const WHT = [246, 243, 239];
  const LEAF = [88, 208, 112];
  const ORG = [255, 154, 58];
  const GRN = [90, 210, 110];
  const STN = [150, 140, 170];
  const BLU = [70, 110, 210];
  const SKIN = [232, 176, 112];
  const CRIM = [180, 24, 48];
  const MUD = [120, 150, 70];
  const BRN = [168, 112, 64];

  const WHIPS = [
    { len: 36, name: '皮鞭' },
    { len: 62, name: '荆鞭' },
    { len: 88, name: '晨星' }
  ];
  const SUB_NAME = { knife: '小刀', water: '圣水', diamond: '钻石', stake: '木桩', '': '—' };
  const SUB_COST = { knife: 1, water: 1, diamond: 1, stake: 1 };
  const RELIC_NAME = { rib: '肋骨', heartR: '心脏', eye: '眼球' };
  const SCORE = {
    zombie: 100, wolf: 180, raven: 160, mud: 170, wraith: 200,
    candle: 80, boss: 4500, stage: 2000, whip: 400, meat: 500, relic: 800
  };

  const STAGES = [
    {
      name: '乔瓦', boss: '巨狼', w: 2460, hp: 20, theme: 'town', relic: 'rib',
      ground: [[0, 500], [564, 300], [924, 360], [1348, 400], [1808, 652]],
      plats: [
        [180, MY, 150], [600, MY, 160], [1000, MY, 170], [1460, MY, 170], [1960, MY, 160],
        [260, HY, 120], [920, HY, 140], [1620, HY, 140]
      ],
      night: [
        [508, GY, 50], [870, GY, 48], [1292, GY, 50], [1754, GY, 48],
        [420, MY, 90], [1180, MY, 100]
      ],
      candles: [
        [150, GY - 30, 'heart'], [280, GY - 30, 'heart'],
        [340, MY - 30, 'whip'], [680, GY - 30, 'heart'],
        [880, HY - 30, 'heart5'], [1120, MY - 30, 'knife'],
        [1280, GY - 30, 'heart'], [1580, MY - 30, 'heart'],
        [1720, GY - 30, 'diamond'], [2060, MY - 30, 'heart5'], [2280, GY - 30, 'heart']
      ],
      ents: [
        [240, GY, 'zombie', 40, 480],
        [420, GY, 'zombie', 40, 490],
        [520, MY, 'raven', 180, 360],
        [532, GY, 'mud', 500, 564],
        [700, GY, 'wolf', 580, 850],
        [900, HY, 'raven', 860, 1060],
        [892, GY, 'mud', 864, 924],
        [1100, GY, 'zombie', 940, 1260],
        [1280, MY, 'wolf', 1000, 1170],
        [1316, GY, 'mud', 1284, 1348],
        [1560, GY, 'wolf', 1360, 1740],
        [1680, MY, 'raven', 1460, 1630],
        [2100, GY, 'zombie', 1820, 2280],
        [2140, MY, 'wolf', 1960, 2120]
      ]
    },
    {
      name: '死河', boss: '河骸', w: 2740, hp: 26, theme: 'swamp', relic: 'heartR',
      ground: [[0, 440], [504, 280], [852, 300], [1212, 320], [1596, 340], [1996, 744]],
      plats: [
        [120, MY, 150], [420, MY, 160], [780, MY, 170], [1140, MY, 170],
        [1520, MY, 180], [1980, MY, 170], [2360, MY, 150],
        [220, HY, 130], [700, HY, 140], [1280, HY, 150], [1840, HY, 140], [2280, HY, 140]
      ],
      night: [
        [446, GY, 52], [790, GY, 56], [1158, GY, 48], [1538, GY, 52], [1942, GY, 48],
        [300, MY, 90], [980, MY, 100], [1700, MY, 90]
      ],
      candles: [
        [110, GY - 30, 'heart'], [200, MY - 30, 'heart'],
        [280, HY - 30, 'whip'], [540, MY - 30, 'heart5'],
        [900, GY - 30, 'water'], [1260, MY - 30, 'heart'],
        [1360, HY - 30, 'heart5'], [1500, GY - 30, 'diamond'],
        [1720, MY - 30, 'heart'], [1900, HY - 30, 'stake'],
        [2140, MY - 30, 'heart5'], [2520, GY - 30, 'heart']
      ],
      ents: [
        [200, GY, 'zombie', 20, 420],
        [380, MY, 'wolf', 120, 300],
        [472, GY, 'mud', 440, 504],
        [560, HY, 'raven', 220, 360],
        [660, GY, 'wolf', 520, 780],
        [820, GY, 'mud', 784, 852],
        [980, MY, 'wolf', 780, 950],
        [1080, GY, 'zombie', 860, 1180],
        [1280, HY, 'raven', 1220, 1420],
        [1180, GY, 'mud', 1152, 1212],
        [1440, MY, 'wolf', 1520, 1700],
        [1700, GY, 'zombie', 1610, 1920],
        [1880, MY, 'raven', 1840, 2120],
        [2100, GY, 'wolf', 2010, 2500],
        [2320, HY, 'raven', 2280, 2420],
        [2480, GY, 'zombie', 2010, 2680]
      ]
    },
    {
      name: '残堡', boss: '伯爵', w: 3020, hp: 34, theme: 'ruin', relic: 'eye',
      ground: [[0, 400], [464, 260], [784, 300], [1152, 280], [1492, 320], [1876, 300], [2236, 784]],
      plats: [
        [90, MY, 150], [340, MY, 160], [660, MY, 170], [1040, MY, 170],
        [1400, MY, 180], [1780, MY, 170], [2180, MY, 180], [2580, MY, 160],
        [180, HY, 130], [600, HY, 140], [1100, HY, 150], [1580, HY, 140],
        [2060, HY, 150], [2500, HY, 140]
      ],
      night: [
        [406, GY, 52], [730, GY, 48], [1090, GY, 56], [1438, GY, 48], [1822, GY, 48], [2182, GY, 48],
        [240, MY, 90], [860, MY, 100], [1660, MY, 90], [2360, MY, 90]
      ],
      candles: [
        [130, GY - 30, 'heart'], [170, MY - 30, 'whip'],
        [260, HY - 30, 'heart5'], [720, MY - 30, 'diamond'],
        [960, GY - 30, 'heart'], [1180, HY - 30, 'stake'],
        [1460, MY - 30, 'heart5'], [1680, GY - 30, 'water'],
        [2100, HY - 30, 'knife'], [2240, MY - 30, 'heart'],
        [2360, GY - 30, 'heart5'], [2680, MY - 30, 'meat'],
        [2860, GY - 30, 'heart']
      ],
      ents: [
        [200, GY, 'zombie', 20, 380],
        [320, MY, 'wolf', 90, 250],
        [432, GY, 'mud', 400, 464],
        [480, HY, 'raven', 180, 330],
        [620, GY, 'zombie', 480, 760],
        [752, GY, 'mud', 724, 784],
        [880, MY, 'wolf', 660, 830],
        [1080, GY, 'zombie', 800, 1120],
        [1120, GY, 'mud', 1084, 1152],
        [1260, HY, 'wolf', 1100, 1250],
        [1420, MY, 'wolf', 1400, 1580],
        [1460, GY, 'mud', 1432, 1492],
        [1700, GY, 'zombie', 1510, 1840],
        [1960, MY, 'wolf', 1780, 1950],
        [2100, GY, 'zombie', 1890, 2200],
        [2320, MY, 'wolf', 2180, 2360],
        [2540, HY, 'raven', 2500, 2640],
        [2720, GY, 'zombie', 2250, 2940]
      ]
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

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    const h = jumpHeight();
    if (h < 74 || h > 96) throw new Error('jump height ' + h);
    if (WHIPS.length !== 3) throw new Error('3 whips');
    if (WHIPS[0].len >= WHIPS[1].len || WHIPS[1].len >= WHIPS[2].len) throw new Error('whip grow');
    if (WHIPS[1].name !== '荆鞭') throw new Error('thorn whip');
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('core faster');
    if (spdMul(false, 2) <= spdMul(false, 1)) throw new Error('later faster');
    if (!SUB_COST.knife || !SUB_COST.water || !SUB_COST.diamond || !SUB_COST.stake) throw new Error('subs');
    if (BEST_KEY !== 'playbox-castlevania2-best') throw new Error('best key');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    if (STAGES[0].name === '城门' || STAGES[0].name === '坟岗' || STAGES[0].name === '回廊') {
      throw new Error('distinct stages');
    }
    if (STAGES[2].boss !== '伯爵') throw new Error('count boss');
    if (CYCLE < 20 || CYCLE > 48) throw new Error('day night cycle');
    const air = WALK * (2 * JUMP_V / GRAV);
    let i, s, hasZ, hasM, hasPit, hasNight, g, gap;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ground.length || !s.ents.length || !s.candles.length || !s.night.length) {
        throw new Error('stage ' + s.name);
      }
      hasZ = false;
      hasM = false;
      hasPit = false;
      hasNight = s.night.length > 0;
      s.ents.forEach(function (e) {
        if (e[2] === 'zombie') hasZ = true;
        if (e[2] === 'mud') hasM = true;
      });
      for (g = 0; g < s.ground.length - 1; g++) {
        gap = s.ground[g + 1][0] - (s.ground[g][0] + s.ground[g][1]);
        if (gap > 20) hasPit = true;
        if (gap < 48) throw new Error('pit tiny ' + s.name + ' ' + gap);
        if (gap > air - 16) throw new Error('pit wide ' + s.name + ' ' + gap + '>' + (air - 16));
      }
      if (!hasZ || !hasM) throw new Error('ents ' + s.name);
      if (!hasPit) throw new Error('pits ' + s.name);
      if (!hasNight) throw new Error('night plats ' + s.name);
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
  const todLabel = document.getElementById('tod-label');
  const heartLabel = document.getElementById('heart-label');
  const whipLabel = document.getElementById('whip-label');
  const subLabel = document.getElementById('sub-label');
  const relicLabel = document.getElementById('relic-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const chainPop = document.getElementById('chain-pop');
  const hintEl = document.getElementById('hint');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
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
    levelW: 2460,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    maxCombo: 0,
    mult: 1,
    hearts: 5,
    whipLv: 1,
    sub: '',
    relics: 0,
    player: null,
    plats: [],
    ents: [],
    shots: [],
    pickups: [],
    candles: [],
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
    subFlash: 0,
    mudT: 0.6,
    tod: 0.18,
    wasNight: false,
    nightT: 1.2,
    wraithT: 1.6
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
  function isNight() {
    return G.tod >= 0.5;
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
  function nightMul() {
    return isNight() ? 1.22 : 1;
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
      if (kind === 'water') {
        this.beep(520, 0.08, 'sine', 0.045, 180);
        this.noise(0.07, 0.04, 600);
      } else if (kind === 'diamond') {
        this.beep(990, 0.06, 'square', 0.046, 1480);
        this.beep(1480, 0.1, 'triangle', 0.034, 720);
        this.noise(0.04, 0.026, 1800);
      } else if (kind === 'stake') {
        this.beep(180, 0.1, 'sawtooth', 0.05, 70);
        this.noise(0.06, 0.04, 380);
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
    dusk() {
      this.ensure();
      this.beep(196, 0.16, 'sine', 0.04, 98);
      this.beep(110, 0.22, 'triangle', 0.03, 55);
    },
    dawn() {
      this.ensure();
      this.beep(392, 0.1, 'sine', 0.038, 523);
      this.beep(659, 0.14, 'triangle', 0.03, 784);
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
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      stageLabel.textContent = (isCore() ? '城核 ' : '') + spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isCore() ? '城核' : '魔城2';
      tagLabel.classList.toggle('warn', isCore());
      tagLabel.classList.toggle('hot', !isCore() && G.stage >= 3);
    }
    if (todLabel) {
      todLabel.textContent = isNight() ? '夜' : '昼';
      todLabel.classList.toggle('night', isNight());
    }
    if (heartLabel) heartLabel.textContent = '心 ' + G.hearts;
    if (whipLabel) {
      const w = WHIPS[clamp(G.whipLv, 1, 3) - 1];
      whipLabel.textContent = w.name;
      whipLabel.className = 'whip' + (G.whipLv === 2 ? ' thorn' : G.whipLv >= 3 ? ' star' : '');
    }
    if (subLabel) {
      subLabel.textContent = '副 ' + (SUB_NAME[G.sub] || '—');
      subLabel.className = 'subw' + (G.sub ? '' : ' off');
    }
    if (relicLabel) relicLabel.textContent = '遗 ' + G.relics;
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 一碰丢命，城核更密更快', 'warn');
    else if (G.mode === 'win') setHint('伯爵已灭 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 空格挥鞭 · 入夜鬼桥可走', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('头目 · ' + G.boss.name, 'hot');
    else if (isNight()) setHint('入夜 · 鬼桥浮现 · 狼群更快 · 空格挥鞭', 'warn');
    else setHint('走跳挥鞭 · 空格挥鞭 · 蜡烛掉心与副武器 · 一碰丢命', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'CV2';
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
    stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'pickup', 'win-flash', 'dusk');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'pickup', 'win-flash', 'dusk');
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

  function makePlat(x, y, w, base, night) {
    return { x: x, y: y, w: w, h: base ? 48 : 12, base: !!base, night: !!night };
  }

  function hpOf(kind) {
    if (kind === 'wolf') return 3;
    if (kind === 'mud') return 2;
    if (kind === 'zombie') return 2;
    return 1;
  }

  function makeEnt(x, y, kind, a, b) {
    const hp = hpOf(kind);
    const fly = kind === 'raven' || kind === 'wraith';
    const mud = kind === 'mud';
    return {
      id: uid++,
      x: x, y: mud ? GY + 16 : y, vx: 0, vy: 0, face: -1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b, base: y, home: x,
      t: rand(0, 2), fire: mud ? rand(0.4, 1.6) : rand(0.5, 1.6),
      grounded: !fly && !mud, dead: false, hitN: 0,
      state: mud ? 'wait' : (kind === 'raven' ? 'fly' : 'walk'),
      w: kind === 'wolf' ? 18 : kind === 'raven' || kind === 'wraith' ? 12 : 14,
      h: kind === 'wolf' ? 18 : kind === 'raven' || kind === 'wraith' ? 12 : kind === 'mud' ? 18 : 22
    };
  }

  function makeBoss(spec) {
    const hp = (spec.hp * (isCore() ? 1.22 : 1)) | 0;
    const fly = spec.boss === '河骸';
    return {
      id: uid++,
      x: spec.w - 150, y: fly ? GY - 24 : GY, vx: 0, vy: 0, face: -1,
      hp: hp, max: hp, kind: spec.boss, name: spec.boss,
      t: 0, fire: 1.1, state: 'wait',
      grounded: !fly, dead: false, active: false,
      hitN: 0, form2: false, swoop: 0,
      w: spec.boss === '伯爵' ? 28 : spec.boss === '巨狼' ? 40 : 32,
      h: spec.boss === '伯爵' ? 46 : spec.boss === '巨狼' ? 28 : 40
    };
  }

  function makeCandle(x, y, drop) {
    return { x: x, y: y, drop: drop || 'heart', broken: false, t: rand(0, 3) };
  }

  function loadStage(n, attract) {
    const spec = STAGES[clamp(n, 1, STAGES.length) - 1];
    G.stage = n;
    G.levelW = spec.w;
    G.plats = [];
    let i, g, p;
    for (i = 0; i < spec.ground.length; i++) {
      g = spec.ground[i];
      G.plats.push(makePlat(g[0], GY, g[1], true, false));
    }
    for (i = 0; i < spec.plats.length; i++) {
      p = spec.plats[i];
      G.plats.push(makePlat(p[0], p[1], p[2], false, false));
    }
    for (i = 0; i < spec.night.length; i++) {
      p = spec.night[i];
      G.plats.push(makePlat(p[0], p[1], p[2], p[1] === GY, true));
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
        if (e[2] === 'wolf') continue;
        const extra = e[2] === 'zombie' ? 'raven' : e[2];
        G.ents.push(makeEnt(e[0] + 28, e[1], extra, e[3], e[4]));
      }
    }
    G.candles = [];
    G.pickups = [];
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
    G.mudT = 0.6;
    G.clearT = 0;
    G.lock = 0;
    G.nightT = 1.1;
    G.wraithT = 1.4;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    G.player = makePlayer(70, GY);
  }

  function platSolid(p) {
    if (p.night && !isNight()) return false;
    return true;
  }

  function platUnder(x, y, skip) {
    let best = null;
    let i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (p === skip || !platSolid(p)) continue;
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
      if (p === skip || !platSolid(p)) continue;
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

  function whipBox() {
    const p = G.player;
    if (G.whipT <= 0) return null;
    const age = 1 - G.whipT / WHIP_T;
    if (age < 0.12 || age > 0.88) return null;
    const reach = whipLen(G.whipLv) * (age < 0.28 ? (age - 0.12) / 0.16 : 1);
    const y = p.y - (p.duck ? 16 : 42);
    const h = p.duck ? 16 : 30;
    if (p.face > 0) return { x: p.x + 4, y: y, w: reach, h: h };
    return { x: p.x - 4 - reach, y: y, w: reach, h: h };
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
    } else if (u.kind === 'whip') {
      if (G.whipLv < 3) {
        G.whipLv += 1;
        toast(WHIPS[G.whipLv - 1].name, false, true);
        addScore(SCORE.whip * G.mult);
      } else {
        G.hearts += 5;
        toast('鞭已满 · 心 +5', false, true);
      }
    } else if (u.kind === 'knife' || u.kind === 'water' || u.kind === 'diamond' || u.kind === 'stake') {
      G.sub = u.kind;
      toast(SUB_NAME[u.kind], false, true);
    } else if (u.kind === 'meat') {
      if (G.lives < LIFE_CAP) {
        G.lives += 1;
        toast('烤肉 1UP', false, true);
        audio.oneup();
      } else {
        G.hearts += 8;
        toast('烤肉 心 +8', false, true);
      }
      addScore(SCORE.meat * G.mult);
    } else if (u.kind === 'rib' || u.kind === 'heartR' || u.kind === 'eye') {
      G.relics = Math.min(3, G.relics + 1);
      toast(RELIC_NAME[u.kind], false, true);
      addScore(SCORE.relic * G.mult);
      floatText(u.x, u.y - 10, RELIC_NAME[u.kind], GOLD, true);
      if (G.relics >= 3) toast('遗物齐全', false, true);
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
    G.whipT = WHIP_T;
    G.whipHit = {};
    G.player.pose = 0.2;
    audio.whip();
    const p = G.player;
    emit(4, {
      x: p.x + p.face * 16, y: p.y - 16, j: 6,
      vx0: p.face * 40, vx1: p.face * 160, vy0: -40, vy1: 30,
      life: 0.16, r0: 1, r1: 2.2, rgb: G.whipLv >= 2 ? LEAF : CYN, g: 80
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
    G.subCd = SUB_CD;
    const p = G.player;
    const kind = G.sub;
    audio.sub(kind);
    G.subFlash = 0.18;
    const rgb = kind === 'water' ? MAG : kind === 'diamond' ? CYN : kind === 'stake' ? BRN : GOLD;
    screenFlash(rgb, 0.28);
    kick(2.4, 'thump');
    emit(8, {
      x: p.x + p.face * 10, y: p.y - 16, j: 6,
      vx0: -80, vx1: 80, vy0: -160, vy1: -20,
      life: 0.24, r0: 1.2, r1: 2.8, rgb: rgb
    });
    if (kind === 'knife') {
      spawnShot({
        x: p.x + p.face * 10, y: p.y - (p.duck ? 10 : 16),
        vx: p.face * 460, vy: 0,
        from: 'p', kind: 'knife', dmg: 1, pierce: 0,
        life: 0.7, rgb: CYN, hit: []
      });
    } else if (kind === 'diamond') {
      spawnShot({
        x: p.x + p.face * 10, y: p.y - (p.duck ? 10 : 16),
        vx: p.face * 240, vy: 180,
        from: 'p', kind: 'diamond', dmg: 1, pierce: 1,
        life: 1.35, rgb: CYN, hit: [], grav: 260, bounce: 3
      });
    } else if (kind === 'stake') {
      spawnShot({
        x: p.x + p.face * 10, y: p.y - (p.duck ? 10 : 16),
        vx: p.face * 280, vy: 0,
        from: 'p', kind: 'stake', dmg: 2, pierce: 0,
        life: 0.85, rgb: BRN, hit: []
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

  function die(why) {
    if (G.deadT > 0 || G.mode !== 'play') return;
    if (G.invuln > 0 && why !== 'fall') return;
    G.why = why || 'hit';
    G.deadT = DIE_T;
    G.lives -= 1;
    G.whipT = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.player.vy = -180;
    audio.death();
    hitStop(0.072);
    kick(6.2, 'die');
    juice(G.player.x, G.player.y - 12, MAG, 1.3);
    syncHud();
  }

  function respawn() {
    G.invuln = invulnTime();
    G.deadT = 0;
    G.whipT = 0;
    G.player = makePlayer(G.checkX, G.checkY);
    G.camX = clamp(G.checkX - VW * 0.4, 0, Math.max(0, G.levelW - VW));
    toast('再起', false, true);
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    const why = G.why === 'fall' ? '坠入深渊了' : G.why === 'boss' ? '被伯爵击倒了' : '被击中了';
    showOverlay('lose', '倒下了', why + '  分 ' + G.score + ' · 连击 ' + G.maxCombo);
    syncHud();
  }

  function goWin() {
    G.mode = 'win';
    audio.win();
    kick(4, 'win-flash');
    screenFlash(GOLD, 0.45);
    const msg = isCore()
      ? '城核平了。残魂在紫雾里散尽。'
      : '昼夜已破。乔瓦、死河、残堡走穿，伯爵散尽。';
    showOverlay('win', isCore() ? '城核平了' : '昼夜已破', msg + '  分 ' + G.score);
    syncHud();
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      if (!isCore()) addScore(9000);
      if (G.relics >= 3) addScore(3000);
      goWin();
      return;
    }
    audio.stage();
    toast(STAGES[G.stage].name, false, true);
    G.stage += 1;
    const keep = {
      lives: G.lives, hearts: G.hearts,
      whipLv: G.whipLv, sub: G.sub, score: G.score, relics: G.relics, tod: G.tod
    };
    loadStage(G.stage, false);
    G.lives = keep.lives;
    G.hearts = keep.hearts;
    G.whipLv = keep.whipLv;
    G.sub = keep.sub;
    G.score = keep.score;
    G.relics = keep.relics;
    G.tod = keep.tod;
    G.wasNight = isNight();
    G.invuln = 1.1;
    syncHud();
  }

  function startGame(kind) {
    audio.ensure();
    audio.start();
    G.kind = kind === 'core' ? 'core' : 'run';
    G.mode = 'play';
    G.lives = LIVES;
    G.hearts = 5;
    G.whipLv = 1;
    G.sub = '';
    G.relics = 0;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.nextLife = LIFE_EVERY;
    G.invuln = 0.6;
    G.deadT = 0;
    G.why = '';
    G.tod = 0.12;
    G.wasNight = false;
    loadStage(1, false);
    hideOverlay();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'run';
    G.lives = LIVES;
    G.hearts = 5;
    G.whipLv = 2;
    G.sub = 'knife';
    G.relics = 0;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.invuln = 99;
    G.deadT = 0;
    G.tod = 0.18;
    G.wasNight = false;
    loadStage(1, true);
    showOverlay('title', '魔城2', '昼夜轮转的特兰西瓦尼亚。夜间鬼桥浮现，狼群出林。皮鞭荆鞭晨星，遗物拼回伯爵。');
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
    demo.u = false;
    demo.fire = false;
    if (p.grounded && pitAhead(p.x, p.y, 1)) demo.u = true;
    if (((G.clock * 2) | 0) % 3 === 0 && G.whipT <= 0) demo.fire = true;
    if (p.x > 720) {
      G.player = makePlayer(70, GY);
      G.camX = 0;
      G.whipLv = 2;
      let i;
      for (i = 0; i < G.candles.length; i++) G.candles[i].broken = false;
    }
  }

  function flipTod(nowNight) {
    if (nowNight) {
      audio.dusk();
      toast('入夜了', false, false);
      screenFlash(HOT, 0.32);
      kick(2.6, 'dusk');
      emit(16, {
        x: G.camX + VW * 0.5, y: 80, j: 80,
        vx0: -40, vx1: 40, vy0: 20, vy1: 80,
        life: 0.5, r0: 1, r1: 2.4, rgb: CYN, g: 40
      });
    } else {
      audio.dawn();
      toast('天亮了', false, true);
      screenFlash(GOLD, 0.28);
      kick(2.2, 'dusk');
    }
    syncHud();
  }

  function updateTod(dt) {
    const cycle = isCore() ? 26 : CYCLE;
    G.tod += dt / cycle;
    if (G.tod >= 1) G.tod -= 1;
    const n = isNight();
    if (n !== G.wasNight) {
      G.wasNight = n;
      if (playing() || G.mode === 'title') flipTod(n);
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

    let ax = 0;
    if (inL()) ax -= 1;
    if (inR()) ax += 1;
    const whipping = G.whipT > 0;
    p.duck = !!(p.grounded && inD() && !inU());
    p.h = p.duck ? 14 : PH;
    if (p.grounded && ax && !p.duck && !whipping) p.face = ax;
    if (p.grounded) {
      p.vx = (p.duck || whipping) ? 0 : ax * WALK;
    }
    p.x += p.vx * dt;
    p.x = clamp(p.x, 16, G.levelW - 16);
    if (G.boss && G.boss.active && !G.boss.dead) {
      const minX = G.levelW - VW + 18;
      if (p.x < minX) p.x = minX;
    }

    const canJump = (p.grounded || p.coyote > 0) && !p.duck && !whipping;
    if (G.jumpBuf > 0 && canJump) {
      p.vy = -JUMP_V;
      p.grounded = false;
      p.coyote = 0;
      G.jumpBuf = 0;
      p.squash = 0.78;
      if (ax) {
        p.face = ax;
        p.vx = ax * WALK;
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
    if (p.grounded && Math.abs(p.vx) > 20) p.run += dt * 10;
    else p.run += dt * 2;
    if (p.pose > 0) p.pose -= dt;

    if (p.grounded && p.x > G.checkX + 80) {
      const ck = platUnder(p.x, p.y, null);
      if (ck && ck.base && !ck.night && p.x > ck.x + 36 && p.x < ck.x + ck.w - 36) {
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

    if (G.invuln > 0) return;
    const pb = pBox();
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      if (e.kind === 'mud' && e.state === 'wait') continue;
      if (overlap(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.45, e.y - e.h, e.w * 0.9, e.h * 0.92)) {
        die('hit');
        return;
      }
    }
    if (G.boss && !G.boss.dead && G.boss.active) {
      const b = G.boss;
      if (overlap(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.4, b.y - b.h, b.w * 0.8, b.h * 0.9)) {
        die('boss');
      }
    }
  }

  function hitEnemy(e, dmg, src) {
    if (e.dead) return;
    e.hp -= dmg;
    e.hitN = 0.08;
    const cx = e.x;
    const cy = e.y - e.h * 0.5;
    if (e.hp <= 0) {
      e.dead = true;
      bumpCombo();
      const sc = (SCORE[e.kind] || 100) * G.mult;
      addScore(sc);
      floatText(cx, cy, String(sc), GOLD, e.kind === 'wolf');
      audio.hit(G.combo);
      juice(cx, cy, e.kind === 'wraith' ? HOT2 : e.kind === 'mud' ? MUD : e.kind === 'wolf' ? BRN : HOT, e.kind === 'wolf' ? 1.1 : 0.75);
      hitStop(e.kind === 'wolf' ? 0.06 : 0.042);
    } else {
      audio.crack();
      emit(6, {
        x: cx, y: cy, j: 5,
        vx0: -120, vx1: 120, vy0: -180, vy1: -20,
        life: 0.2, r0: 1, r1: 2.4, rgb: src === 'whip' ? LEAF : GOLD
      });
      hitStop(0.034);
    }
  }

  function resolveWhip() {
    const box = whipBox();
    if (!box) return;
    let i, c, e;
    for (i = 0; i < G.candles.length; i++) {
      c = G.candles[i];
      if (c.broken) continue;
      if (overlap(box.x, box.y, box.w, box.h, c.x - 12, c.y - 20, 24, 34)) breakCandle(c);
    }
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      if (e.kind === 'mud' && e.state === 'wait') continue;
      if (G.whipHit[e.id]) continue;
      if (overlap(box.x, box.y, box.w, box.h, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) {
        G.whipHit[e.id] = 1;
        hitEnemy(e, G.whipLv >= 3 ? 2 : 1, 'whip');
      }
    }
    if (G.boss && !G.boss.dead && G.boss.active && !G.whipHit[G.boss.id]) {
      const b = G.boss;
      if (overlap(box.x, box.y, box.w, box.h, b.x - b.w * 0.5, b.y - b.h, b.w, b.h)) {
        G.whipHit[b.id] = 1;
        hitBoss(G.whipLv >= 3 ? 2 : 1);
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
      if (b.kind === '伯爵' && !b.form2) {
        b.form2 = true;
        b.kind = '残魂';
        b.name = '残魂伯爵';
        b.hp = (16 * (isCore() ? 1.22 : 1)) | 0;
        b.max = b.hp;
        b.h = 34;
        b.w = 36;
        b.state = 'fly';
        b.fire = 0.4;
        b.y = GY - 80;
        toast('伯爵化残魂', false, true);
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
      const spec = STAGES[G.stage - 1];
      if (spec && spec.relic) spawnPickup(b.x, b.y - 20, spec.relic);
      G.lock = 0.2;
      G.clearT = 1.8;
    }
  }

  function onScreen(x, y, pad) {
    const m = pad || 40;
    return x > G.camX - m && x < G.camX + VW + m && y > G.camY - m && y < G.camY + VH + m;
  }

  function spawnWraith() {
    let n = 0;
    let i;
    for (i = 0; i < G.ents.length; i++) {
      if (!G.ents[i].dead && G.ents[i].kind === 'wraith') n += 1;
    }
    const cap = isCore() ? 4 : 3;
    if (n >= cap) return;
    const fromL = Math.random() < 0.5;
    const x = fromL ? G.camX - 18 : G.camX + VW + 18;
    const y = 150 + rand(0, 140);
    const e = makeEnt(x, y, 'wraith', 0, 0);
    e.face = fromL ? 1 : -1;
    e.base = y;
    G.ents.push(e);
  }

  function spawnNightWolf() {
    let n = 0;
    let i;
    for (i = 0; i < G.ents.length; i++) {
      if (!G.ents[i].dead && G.ents[i].kind === 'wolf') n += 1;
    }
    if (n >= (isCore() ? 7 : 5)) return;
    const fromL = Math.random() < 0.5;
    const x = clamp(fromL ? G.camX + 36 : G.camX + VW - 36, 40, G.levelW - 40);
    if (!standAt(x, GY)) return;
    const e = makeEnt(x, GY, 'wolf', G.camX - 20, G.camX + VW + 20);
    e.face = fromL ? 1 : -1;
    G.ents.push(e);
  }

  function updateMud(e, dt) {
    const mul = spdMul(isCore(), G.stage) * nightMul();
    if (e.state === 'wait') {
      e.y = GY + 16;
      e.x = e.home;
      e.fire -= dt;
      if (e.fire <= 0 && playing() && G.deadT <= 0 && Math.abs(G.player.x - e.home) < 240) {
        e.state = 'leap';
        e.vy = -520;
        e.vx = (G.player.x > e.x ? 1 : -1) * 110 * mul;
        e.face = e.vx >= 0 ? 1 : -1;
        e.y = GY + 2;
        audio.splash();
        emit(8, {
          x: e.x, y: GY, j: 8,
          vx0: -80, vx1: 80, vy0: -160, vy1: -20,
          life: 0.28, r0: 1, r1: 2.6, rgb: MUD, g: 200
        });
      }
      return;
    }
    if (e.state === 'leap') {
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
          e.state = 'walk';
          e.grounded = true;
          e.a = plat.x + 8;
          e.b = plat.x + plat.w - 8;
        }
      }
      if (e.y > VH + 24) {
        e.state = 'wait';
        e.fire = isCore() ? 0.9 : 1.5;
        e.x = e.home;
      }
      return;
    }
    const walk = 36 * mul;
    if (e.x < e.a) e.face = 1;
    if (e.x > e.b) e.face = -1;
    if (!standAt(e.x + e.face * 12, e.y) && standAt(e.x, e.y)) e.face *= -1;
    else e.x += e.face * walk * dt;
    if (e.y > GY + 10) {
      e.state = 'wait';
      e.fire = 1.2;
      e.x = e.home;
    }
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    if (e.hitN > 0) e.hitN -= dt;
    e.t += dt;
    const mul = spdMul(isCore(), G.stage) * nightMul();
    if (e.kind === 'mud') {
      updateMud(e, dt);
      return;
    }
    if (e.kind === 'wraith') {
      e.x += e.face * 108 * mul * dt;
      e.y = e.base + Math.sin(e.t * 4.2) * 30;
      if (e.x < G.camX - 60 || e.x > G.camX + VW + 60) e.dead = true;
      return;
    }
    if (!onScreen(e.x, e.y, 80)) return;
    if (e.kind === 'wolf' && e.state === 'leap') {
      e.fire -= dt;
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
          e.state = 'walk';
          e.grounded = true;
        }
      }
      if (e.y > VH + 20) e.dead = true;
      return;
    }
    if (e.kind === 'raven') {
      if (e.state === 'dive') {
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.vy += 220 * dt;
        if (e.y > GY + 8 || e.x < e.a - 40 || e.x > e.b + 40) {
          e.state = 'fly';
          e.y = e.base;
          e.vx = 0;
          e.vy = 0;
        }
        return;
      }
      e.x += (e.face || -1) * 56 * mul * dt;
      if (e.x < e.a) e.face = 1;
      if (e.x > e.b) e.face = -1;
      e.y = e.base + Math.sin(e.t * 3.1) * 16;
      e.fire -= dt;
      if (playing() && e.fire <= 0 && Math.abs(G.player.x - e.x) < 160 && G.player.y > e.y) {
        e.state = 'dive';
        e.vx = (G.player.x - e.x) * 1.4;
        e.vy = 160;
        e.fire = isCore() ? 1.4 : 2.1;
      }
      return;
    }
    const walk = (e.kind === 'wolf' ? 78 : 30) * mul;
    if (e.x < e.a) e.face = 1;
    if (e.x > e.b) e.face = -1;
    if (!standAt(e.x + e.face * 12, e.y) && standAt(e.x, e.y)) e.face *= -1;
    else e.x += e.face * walk * dt;
    if (e.kind === 'wolf') {
      e.fire -= dt;
      if (e.fire <= 0 && playing() && G.deadT <= 0 && Math.abs(G.player.x - e.x) < 120) {
        e.fire = (isCore() ? 1.1 : 1.6) / mul;
        e.face = G.player.x < e.x ? -1 : 1;
        e.state = 'leap';
        e.vy = -340;
        e.vx = e.face * 160 * mul;
        e.grounded = false;
      }
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    if (b.hitN > 0) b.hitN -= dt;
    const p = G.player;
    if (!b.active) {
      if (playing() && p.x > G.levelW - 420) {
        b.active = true;
        audio.boss();
        toast(b.name + ' 现身', false, true);
        screenFlash(HOT, 0.32);
        kick(3.4, 'boom');
      }
      return;
    }
    b.t += dt;
    const mul = spdMul(isCore(), G.stage);
    const low = b.hp / b.max < 0.42;
    if (b.kind === '巨狼') {
      if (b.state === 'wait' || b.state === 'idle') b.state = 'run';
      b.face = p.x < b.x ? -1 : 1;
      if (b.state === 'leap') {
        b.vy += GRAV * dt;
        b.x += b.vx * dt;
        const y0 = b.y;
        b.y += b.vy * dt;
        if (b.vy > 0) {
          const plat = landOn(b.x, y0, b.y, null);
          if (plat) {
            b.y = plat.y;
            b.vy = 0;
            b.vx = 0;
            b.state = 'run';
          }
        }
        if (b.y > VH + 40) {
          b.y = GY;
          b.state = 'run';
        }
      } else {
        b.y = GY;
        const spd = (low ? 110 : 78) * mul;
        b.x += b.face * spd * dt;
        const minX = G.levelW - VW + 40;
        const maxX = G.levelW - 50;
        if (b.x < minX) { b.x = minX; b.face = 1; }
        if (b.x > maxX) { b.x = maxX; b.face = -1; }
        b.fire -= dt;
        if (b.fire <= 0 && playing() && G.deadT <= 0) {
          b.fire = (low ? 0.85 : 1.25) / mul;
          b.state = 'leap';
          b.vy = -380;
          b.vx = b.face * 190 * mul;
        }
      }
    } else if (b.kind === '河骸') {
      b.x = G.levelW - 170 + Math.sin(b.t * 0.7) * 90;
      b.y = GY - 18 + Math.sin(b.t * 1.2) * 10;
      b.face = p.x < b.x ? -1 : 1;
      b.fire -= dt;
      if (b.fire <= 0 && playing() && G.deadT <= 0) {
        b.fire = (low ? 0.7 : 1.05) / mul;
        const n = low ? 3 : 2;
        let i;
        for (i = 0; i < n; i++) {
          spawnShot({
            x: b.x + b.face * 10, y: b.y - 18,
            vx: b.face * (130 + i * 50),
            vy: -220 + i * 40,
            from: 'e', kind: 'bone', dmg: 1, pierce: 0,
            life: 1.55, rgb: STN, hit: [], grav: 760, spin: 0
          });
        }
      }
    } else if (b.kind === '残魂') {
      b.swoop = (b.swoop || 0) + dt;
      if (b.swoop > 2.2) {
        b.x += (p.x - b.x) * 1.8 * dt;
        b.y += (p.y - 20 - b.y) * 1.6 * dt;
        if (b.swoop > 2.85) b.swoop = 0;
      } else {
        b.x = G.levelW - 160 + Math.sin(b.t * 1.1) * 90;
        b.y = GY - 90 + Math.sin(b.t * 2.1) * 24;
      }
      b.face = p.x < b.x ? -1 : 1;
      b.fire -= dt;
      if (b.fire <= 0 && playing() && G.deadT <= 0) {
        b.fire = (low ? 0.55 : 0.82) / mul;
        spawnShot({
          x: b.x, y: b.y,
          vx: b.face * 180, vy: 80,
          from: 'e', kind: 'fire', dmg: 1, pierce: 0,
          life: 1.4, rgb: HOT, hit: []
        });
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
              from: 'e', kind: 'fire', dmg: 1, pierce: 0,
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
    const r = s.kind === 'pool' ? 16 : (s.kind === 'diamond' || s.kind === 'stake' || s.kind === 'bone' ? 8 : 5);
    return overlap(s.x - r, s.y - r, r * 2, r * 2, x - w * 0.5, y - h, w, h);
  }

  function updateShots(dt) {
    const p = G.player;
    let i, s, j, e;
    for (i = G.shots.length - 1; i >= 0; i--) {
      s = G.shots[i];
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
        if (s.kind === 'flask' || s.kind === 'bone' || s.kind === 'diamond') {
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
            if (s.kind === 'diamond' && (s.bounce || 0) > 0) {
              s.y = plat.y - 4;
              s.vy = -Math.abs(s.vy) * 0.92;
              s.bounce -= 1;
              s.hit = [];
              audio.crack();
              popSpark(s.x, s.y, CYN, 10);
            } else if (s.kind === 'bone' || s.kind === 'diamond') {
              s.life = 0;
            }
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
          if (e.kind === 'mud' && e.state === 'wait') continue;
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
            const bd = s.kind === 'stake' ? (G.relics >= 3 ? 4 : 3) : (s.dmg || 1);
            hitBoss(bd);
            if (s.kind !== 'pool' && !s.pierce) s.life = 0;
            else if (s.pierce) s.pierce -= 1;
          }
        }
      } else if (playing() && G.deadT <= 0 && G.invuln <= 0) {
        const pb = pBox();
        if (shotHits(s, p.x, p.y, p.w, p.h) || overlap(s.x - 4, s.y - 4, 8, 8, pb.x, pb.y, pb.w, pb.h)) {
          s.life = 0;
          die('hit');
        }
      }
    }
  }

  function updateCam(dt) {
    const p = G.player;
    if (!p) return;
    let tx = p.face > 0 ? p.x - VW * 0.36 : p.x - VW * 0.56;
    if (G.boss && G.boss.active && !G.boss.dead) tx = G.levelW - VW;
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
        a: rand(0.03, 0.09) * (isNight() ? 1.6 : 1),
        vx: rand(-8, 8)
      });
    }
    for (i = mist.length - 1; i >= 0; i--) {
      o = mist[i];
      o.x += o.vx * dt;
      if (o.x < G.camX - 80 || o.x > G.camX + VW + 80) mist.splice(i, 1);
    }
    if (isNight() || isCore()) {
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
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
  }

  function updateNightSpawns(dt) {
    if (!playing() || G.deadT > 0) return;
    const bossOn = G.boss && G.boss.active && !G.boss.dead;
    if (bossOn) return;
    if (isNight()) {
      G.wraithT -= dt;
      const wait = (isCore() ? 1.15 : 1.55) / spdMul(isCore(), G.stage);
      if (G.wraithT <= 0) {
        G.wraithT = wait + rand(0, 0.4);
        spawnWraith();
      }
      G.nightT -= dt;
      if (G.nightT <= 0) {
        G.nightT = (isCore() ? 2.2 : 3.1) + rand(0, 0.6);
        spawnNightWolf();
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
    updateTod(dt);
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
    updateNightSpawns(dt);
    for (i = 0; i < G.candles.length; i++) G.candles[i].t += dt;
    updateCam(dt);
    updateFx(dt);
  }

  function drawSky() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const night = isNight();
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (night) {
      if (spec.theme === 'ruin') {
        g.addColorStop(0, '#0a0618');
        g.addColorStop(0.55, '#12081c');
        g.addColorStop(1, '#080412');
      } else if (spec.theme === 'swamp') {
        g.addColorStop(0, '#081014');
        g.addColorStop(0.5, '#0c1410');
        g.addColorStop(1, '#08100c');
      } else {
        g.addColorStop(0, '#0a0820');
        g.addColorStop(0.5, '#100c22');
        g.addColorStop(1, '#080614');
      }
    } else if (spec.theme === 'ruin') {
      g.addColorStop(0, '#241028');
      g.addColorStop(0.55, '#1c1020');
      g.addColorStop(1, '#140c16');
    } else if (spec.theme === 'swamp') {
      g.addColorStop(0, '#1c2830');
      g.addColorStop(0.5, '#18241c');
      g.addColorStop(1, '#101814');
    } else {
      g.addColorStop(0, '#2a1840');
      g.addColorStop(0.45, '#241830');
      g.addColorStop(1, '#140c1c');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const mx = sx(G.camX + VW * 0.78);
    const my = sy(G.camY + 42);
    if (night) {
      ctx.fillStyle = rgba(CYN, 0.55);
      ctx.beginPath();
      ctx.arc(mx, my, 18 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.22);
      ctx.beginPath();
      ctx.arc(mx - 6 * scale, my - 4 * scale, 8 * scale, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(GOLD, 0.62);
      ctx.beginPath();
      ctx.arc(mx, my, 22 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(ORG, 0.28);
      ctx.beginPath();
      ctx.arc(mx, my, 32 * scale, 0, TAU);
      ctx.fill();
    }

    let i;
    for (i = 0; i < (night ? 22 : 10); i++) {
      const hx = hash2(i + 11 + G.stage);
      const hy = hash2(i + 29);
      ctx.fillStyle = rgba(WHT, (night ? 0.28 : 0.12) + hx * 0.4);
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
    const night = isNight();
    let i, x, h, w, win;
    for (i = -2; i < 26; i++) {
      x = sx((Math.floor((G.camX + par) / 72) + i) * 72 - par);
      h = (70 + hash2(i + 17 + G.stage * 9) * 110) * scale;
      w = (36 + hash2(i + 5) * 22) * scale;
      ctx.fillStyle = i % 2 ? '#120818' : '#0c0614';
      if (spec.theme === 'swamp') ctx.fillStyle = i % 2 ? '#10180e' : '#0c140c';
      if (spec.theme === 'ruin') ctx.fillStyle = i % 2 ? '#180814' : '#100610';
      ctx.fillRect(x, base - h, w, h + 40 * scale);
      ctx.fillStyle = rgba(HOT, 0.12);
      ctx.fillRect(x, base - h, w, 3 * scale);
      win = hash2(i + 3);
      if (spec.theme === 'town') {
        ctx.fillStyle = night
          ? (win > 0.7 ? rgba(GOLD, 0.18) : rgba(CYN, 0.08))
          : (win > 0.4 ? rgba(GOLD, 0.45) : rgba(ORG, 0.22));
        ctx.fillRect(x + 8 * scale, base - h + 16 * scale, 6 * scale, 8 * scale);
        ctx.fillRect(x + 20 * scale, base - h + 32 * scale, 6 * scale, 8 * scale);
      } else if (spec.theme === 'swamp') {
        ctx.strokeStyle = rgba(LEAF, 0.28);
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.5, base - h);
        ctx.quadraticCurveTo(x + w, base - h - 20 * scale, x + w * 0.3, base - h - 36 * scale);
        ctx.stroke();
      } else {
        ctx.fillStyle = rgba(MAG, night ? 0.18 : 0.28);
        ctx.fillRect(x + w * 0.3, base - h - 14 * scale, w * 0.4, 14 * scale);
      }
    }
    for (i = 0; i < mist.length; i++) {
      const m = mist[i];
      ctx.fillStyle = rgba(night ? CYN : HOT2, m.a);
      ctx.beginPath();
      ctx.arc(sx(m.x), sy(m.y), m.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawAbyss() {
    const bases = G.plats.filter(function (p) { return p.base && platSolid(p); });
    const y = sy(GY + 8);
    ctx.fillStyle = rgba(isNight() ? HOT : CYN, 0.08);
    ctx.fillRect(sx(G.camX - 10), y, (VW + 20) * scale, 50 * scale);
    let x, covered, i;
    for (x = G.camX; x < G.camX + VW; x += 16) {
      covered = false;
      for (i = 0; i < bases.length; i++) {
        if (x >= bases[i].x && x <= bases[i].x + bases[i].w) covered = true;
      }
      if (covered) continue;
      const wave = Math.sin(x * 0.12 + G.clock * 5) * 3;
      ctx.fillStyle = rgba(MUD, 0.28 + Math.sin(x * 0.1 + G.clock * 4) * 0.08);
      ctx.fillRect(sx(x), sy(GY + 2 + wave), 14 * scale, 12 * scale);
      ctx.fillStyle = rgba(HOT, 0.12);
      ctx.fillRect(sx(x), sy(GY + 10), 14 * scale, 8 * scale);
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
      if (p.night && !isNight()) {
        ctx.save();
        ctx.globalAlpha = 0.28;
        ctx.strokeStyle = rgba(CYN, 0.7);
        ctx.lineWidth = 1.4 * scale;
        ctx.setLineDash([4 * scale, 4 * scale]);
        ctx.strokeRect(x, y, w, 8 * scale);
        ctx.restore();
        continue;
      }
      if (p.night) {
        ctx.fillStyle = 'rgba(20, 40, 70, 0.85)';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = rgba(CYN, 0.85);
        ctx.fillRect(x, y, w, 2.6 * scale);
        ctx.fillStyle = rgba(WHT, 0.22);
        ctx.fillRect(x + 2 * scale, y + 2.6 * scale, w - 4 * scale, 1.2 * scale);
        continue;
      }
      ctx.fillStyle = p.base ? '#160a22' : '#1a1028';
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
    else if (u.kind === 'knife') { rgb = CYN; mark = '刀'; }
    else if (u.kind === 'water') { rgb = MAG; mark = '水'; }
    else if (u.kind === 'diamond') { rgb = CYN; mark = '钻'; }
    else if (u.kind === 'stake') { rgb = BRN; mark = '桩'; }
    else if (u.kind === 'meat') { rgb = ORG; mark = '肉'; }
    else if (u.kind === 'heart5') { rgb = MAG; mark = '心'; }
    else if (u.kind === 'rib') { rgb = WHT; mark = '肋'; }
    else if (u.kind === 'heartR') { rgb = MAG; mark = '脏'; }
    else if (u.kind === 'eye') { rgb = GOLD; mark = '眼'; }
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
    if (s.kind === 'bone' || s.kind === 'diamond') ctx.rotate(s.spin || G.clock * 8);
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
    } else if (s.kind === 'diamond') {
      ctx.fillStyle = rgba(CYN, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -7 * sc);
      ctx.lineTo(6 * sc, 0);
      ctx.lineTo(0, 7 * sc);
      ctx.lineTo(-6 * sc, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.fillRect(-1.4 * sc, -1.4 * sc, 2.8 * sc, 2.8 * sc);
    } else if (s.kind === 'stake') {
      ctx.fillStyle = rgba(BRN, 0.95);
      ctx.fillRect(-8 * sc, -2 * sc, 16 * sc, 4 * sc);
      ctx.fillStyle = rgba(STN, 0.9);
      ctx.beginPath();
      ctx.moveTo(8 * sc, 0);
      ctx.lineTo(12 * sc, -3 * sc);
      ctx.lineTo(12 * sc, 3 * sc);
      ctx.closePath();
      ctx.fill();
    } else if (s.kind === 'fire') {
      ctx.fillStyle = rgba(s.rgb || ORG, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, 5 * sc, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.beginPath();
      ctx.arc(-1 * sc, -1 * sc, 2 * sc, 0, TAU);
      ctx.fill();
    } else if (s.kind === 'bone') {
      ctx.fillStyle = rgba(WHT, 0.92);
      ctx.fillRect(-7 * sc, -2 * sc, 14 * sc, 4 * sc);
      ctx.beginPath();
      ctx.arc(-7 * sc, 0, 3.2 * sc, 0, TAU);
      ctx.arc(7 * sc, 0, 3.2 * sc, 0, TAU);
      ctx.fill();
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
    const age = 1 - G.whipT / WHIP_T;
    const reach = whipLen(G.whipLv) * (age < 0.22 ? age / 0.22 : age > 0.85 ? (1 - age) / 0.15 : 1);
    const y = p.y - (p.duck ? 10 : 26);
    const x0 = p.x + p.face * 8;
    const x1 = p.x + p.face * (8 + reach);
    ctx.save();
    ctx.strokeStyle = G.whipLv >= 3 ? rgba(GOLD, 0.95) : G.whipLv === 2 ? rgba(LEAF, 0.95) : rgba(ORG, 0.9);
    ctx.lineWidth = (G.whipLv >= 2 ? 2.4 : 1.8) * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx(x0), sy(y));
    const sag = Math.sin(age * Math.PI) * 6;
    ctx.quadraticCurveTo(sx((x0 + x1) * 0.5), sy(y + sag), sx(x1), sy(y));
    ctx.stroke();
    if (G.whipLv >= 3) {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(sx(x1), sy(y), 4.2 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.beginPath();
      ctx.arc(sx(x1 - p.face), sy(y - 1), 1.6 * scale, 0, TAU);
      ctx.fill();
    } else if (G.whipLv === 2) {
      ctx.fillStyle = rgba(LEAF, 0.9);
      ctx.beginPath();
      ctx.arc(sx(x1), sy(y), 2.6 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(GRN, 0.8);
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(x1), sy(y - 4));
      ctx.lineTo(sx(x1 + p.face * 3), sy(y + 4));
      ctx.stroke();
    } else {
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.beginPath();
      ctx.arc(sx(x1), sy(y), 2 * scale, 0, TAU);
      ctx.fill();
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
    ctx.fillStyle = rgba(HOT, 0.7);
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
    ctx.fillStyle = rgba(LEAF, 0.92);
    ctx.fillRect(-6.2 * s, -bodyH * s - 5 * s, 12.4 * s, bodyH * s);
    ctx.fillStyle = rgba(GOLD, 0.55);
    ctx.fillRect(-6.2 * s, -bodyH * s - 5 * s, 12.4 * s, 2 * s);
    ctx.fillStyle = rgba(SKIN, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -(bodyH + 11) * s, 5.2 * s, 5.4 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#3a2060';
    ctx.fillRect(-5 * s, -(bodyH + 14) * s, 10 * s, 2.4 * s);
    ctx.fillStyle = '#1a0a14';
    ctx.fillRect(1.2 * s, -(bodyH + 12.4) * s, 3.2 * s, 1.6 * s);
    const whipOn = G.whipT > 0;
    ctx.strokeStyle = rgba(WHT, 0.9);
    ctx.lineWidth = 1.8 * s;
    ctx.beginPath();
    ctx.moveTo(3 * s, -(bodyH + 1) * s);
    ctx.lineTo((whipOn ? 14 : 8) * s, -(bodyH + (whipOn ? 2 : 1)) * s);
    ctx.stroke();
    ctx.restore();
  }

  function drawEnt(e) {
    if (e.dead) return;
    if (e.kind === 'mud' && e.state === 'wait' && !onScreen(e.x, GY, 20)) return;
    if (e.hitN > 0 && ((G.t * 30) | 0) % 2 === 0) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(e.face, 1);
    if (e.kind === 'wraith') {
      ctx.globalAlpha = 0.82;
      ctx.fillStyle = rgba(HOT2, 0.9);
      ctx.beginPath();
      ctx.ellipse(0, -8 * s, 7 * s, 10 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.7);
      ctx.fillRect(-2.4 * s, -12 * s, 2 * s, 2 * s);
      ctx.fillRect(1 * s, -12 * s, 2 * s, 2 * s);
      ctx.fillStyle = rgba(HOT, 0.45);
      ctx.beginPath();
      ctx.moveTo(-6 * s, -2 * s);
      ctx.quadraticCurveTo(0, 10 * s, 6 * s, -2 * s);
      ctx.fill();
    } else if (e.kind === 'raven') {
      const flap = Math.sin(e.t * 12) * 6;
      ctx.fillStyle = rgba(STN, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, -6 * s, 4.4 * s, 3.2 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.7);
      ctx.beginPath();
      ctx.moveTo(0, -6 * s);
      ctx.lineTo(-13 * s, (-8 - flap) * s);
      ctx.lineTo(-2 * s, -4 * s);
      ctx.moveTo(0, -6 * s);
      ctx.lineTo(13 * s, (-8 + flap) * s);
      ctx.lineTo(2 * s, -4 * s);
      ctx.fill();
      ctx.fillStyle = rgba(ORG, 0.9);
      ctx.fillRect(3 * s, -7 * s, 4 * s, 1.6 * s);
    } else if (e.kind === 'wolf') {
      const hop = e.state === 'leap' ? -3 : Math.sin(e.t * 10) * 1.4;
      ctx.fillStyle = rgba(BRN, 0.95);
      ctx.fillRect(-10 * s, (-12 + hop) * s, 18 * s, 10 * s);
      ctx.beginPath();
      ctx.ellipse(8 * s, (-14 + hop) * s, 6 * s, 5 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.fillRect(10 * s, (-15 + hop) * s, 3 * s, 1.6 * s);
      ctx.fillStyle = rgba(MAG, 0.8);
      ctx.fillRect(11 * s, (-16 + hop) * s, 1.6 * s, 1.6 * s);
      ctx.fillStyle = rgba(STN, 0.8);
      ctx.fillRect(-10 * s, (-16 + hop) * s, 3 * s, 4 * s);
      ctx.fillRect(-6 * s, (-16 + hop) * s, 3 * s, 4 * s);
    } else if (e.kind === 'mud') {
      if (e.state === 'wait') {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = rgba(MUD, 0.75);
        ctx.beginPath();
        ctx.ellipse(0, -4 * s, 9 * s, 4 * s, 0, 0, TAU);
        ctx.fill();
      } else {
        const hop = e.state === 'leap' ? -4 : Math.sin(e.t * 8) * 2;
        ctx.fillStyle = rgba(MUD, 0.95);
        ctx.beginPath();
        ctx.ellipse(0, (-10 + hop) * s, 8 * s, 10 * s, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(GRN, 0.7);
        ctx.fillRect(-2 * s, (-14 + hop) * s, 2 * s, 2 * s);
        ctx.fillRect(2 * s, (-14 + hop) * s, 2 * s, 2 * s);
      }
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
    if (b.kind === '巨狼') {
      const hop = b.state === 'leap' ? -6 : Math.sin(G.clock * 8) * 2;
      ctx.fillStyle = rgba(BRN, 0.95);
      ctx.fillRect(-18 * s, (-20 + hop) * s, 32 * s, 18 * s);
      ctx.beginPath();
      ctx.ellipse(14 * s, (-22 + hop) * s, 10 * s, 8 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.75);
      ctx.fillRect(18 * s, (-24 + hop) * s, 6 * s, 2.4 * s);
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.fillRect(20 * s, (-26 + hop) * s, 3 * s, 3 * s);
      ctx.fillStyle = rgba(STN, 0.85);
      ctx.fillRect(-16 * s, (-28 + hop) * s, 5 * s, 8 * s);
      ctx.fillRect(-8 * s, (-28 + hop) * s, 5 * s, 8 * s);
      ctx.fillStyle = rgba(GOLD, 0.5);
      ctx.fillRect(-10 * s, (-14 + hop) * s, 14 * s, 3 * s);
    } else if (b.kind === '河骸') {
      ctx.fillStyle = rgba(MUD, 0.5);
      ctx.beginPath();
      ctx.ellipse(0, 4 * s, 22 * s, 8 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.fillRect(-10 * s, -28 * s, 20 * s, 24 * s);
      ctx.beginPath();
      ctx.arc(0, -34 * s, 8 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.7);
      ctx.fillRect(-4 * s, -36 * s, 3 * s, 3 * s);
      ctx.strokeStyle = rgba(STN, 0.9);
      ctx.lineWidth = 2.2 * s;
      ctx.beginPath();
      ctx.moveTo(8 * s, -18 * s);
      ctx.lineTo(18 * s, 2 * s);
      ctx.stroke();
    } else if (b.kind === '残魂') {
      const flap = Math.sin(G.clock * 9) * 12;
      ctx.fillStyle = rgba(HOT, 0.85);
      ctx.beginPath();
      ctx.moveTo(0, -8 * s);
      ctx.lineTo(-30 * s, (-16 - flap) * s);
      ctx.lineTo(-8 * s, 6 * s);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -8 * s);
      ctx.lineTo(30 * s, (-16 + flap) * s);
      ctx.lineTo(8 * s, 6 * s);
      ctx.fill();
      ctx.fillStyle = rgba(CRIM, 0.9);
      ctx.beginPath();
      ctx.ellipse(0, -6 * s, 11 * s, 9 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.85);
      ctx.beginPath();
      ctx.arc(5 * s, -8 * s, 2.4 * s, 0, TAU);
      ctx.fill();
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
    ctx.fillText(b.name + (b.form2 ? ' Ⅱ' : ''), ox + VW * 0.5 * scale, y - 3 * scale);
  }

  function drawTodMeter() {
    const x = ox + 16 * scale;
    const y = oy + VH * scale - 14 * scale;
    const w = 72 * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(x, y, w, 5 * scale);
    ctx.fillStyle = rgba(isNight() ? CYN : GOLD, 0.85);
    ctx.fillRect(x, y, w * G.tod, 5 * scale);
    ctx.strokeStyle = rgba(WHT, 0.25);
    ctx.strokeRect(x, y, w, 5 * scale);
    ctx.fillStyle = rgba(GOLD, 0.5);
    ctx.fillRect(x + w * 0.5 - 0.6 * scale, y - 2 * scale, 1.2 * scale, 9 * scale);
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
    if (isNight() || isCore()) {
      ctx.strokeStyle = isNight() ? 'rgba(140,180,255,0.22)' : 'rgba(180,160,255,0.22)';
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
  }

  function draw() {
    dpr = dpr || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#050214';
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
        run: p.run, grounded: p.grounded,
        squash: p.squash, duck: p.duck, blink: blink
      });
      drawWhip(p);
    }

    drawFx();
    drawBossBar();
    drawTodMeter();

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
    const subk = k === 'z' || k === 'Z' || k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (space) keys.fire = down;
    if (subk) keys.sub = down;

    if (down && (isMove || space || k === 'Enter' || subk)) e.preventDefault();
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
