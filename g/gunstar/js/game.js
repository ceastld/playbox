'use strict';

/* 枪星 — Gunstar Heroes remake. Side-scroll smash run-and-gun. No CDN.
   Distinct from 魂斗 (one-hit / pickups), 合金 (tank / POW), 制裁 (street fists). Optional autoplay. */

(function () {
  const VW = 640;
  const VH = 360;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const HP_MAX = 12;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const GY = 328;
  const MY = 256;
  const HY = 184;
  const WALK = 228;
  const AIR = 0.92;
  const JUMP_V = 500;
  const GRAV = 1450;
  const MAX_FALL = 580;
  const COYOTE = 0.09;
  const BUFFER = 0.12;
  const PW = 14;
  const PH = 26;
  const INVULN = 1.25;
  const DIE_T = 0.82;
  const BEST_KEY = 'playbox-gunstar-best';
  const MUTE_KEY = 'playbox-gunstar-mute';
  const AUTO_SPEED_KEY = 'playbox-gunstar-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_SCALE = [1, 0.52, 0.78, 1, 3.4];
  const OPS = '方向 / D 走跳 · 空格八向开火 · Shift/Z 斩 · Q 换枪 · A 自动 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 138, 20];
  const HOT2 = [255, 178, 74];
  const WHT = [246, 241, 232];
  const LEAF = [125, 255, 74];
  const ORG = [255, 168, 64];
  const PUR = [168, 80, 255];
  const TEAL = [48, 200, 180];

  const WEP_ORDER = ['spread', 'laser', 'flame'];
  const WEP_NAME = { spread: '散弹', laser: '激光', flame: '火焰' };
  const WEAPONS = {
    spread: { cd: 0.2, max: 14, spd: 500, dmg: 1, pierce: 0, bounce: 0, n: 5, fan: 0.32, life: 0.5, rgb: LEAF },
    laser: { cd: 0.085, max: 4, spd: 820, dmg: 2, pierce: 5, bounce: 0, n: 1, fan: 0, life: 0.4, rgb: CYN },
    flame: { cd: 0.16, max: 6, spd: 290, dmg: 2, pierce: 0, bounce: 1, n: 1, fan: 0, life: 0.95, rgb: HOT }
  };

  const KINDS = {
    hop: { hp: 2, score: 120, w: 14, h: 24, name: '星兵' },
    rush: { hp: 3, score: 160, w: 18, h: 18, name: '甲冲' },
    float: { hp: 3, score: 240, w: 16, h: 16, name: '浮炮' },
    crawl: { hp: 2, score: 140, w: 16, h: 14, name: '晶蛛' },
    toss: { hp: 2, score: 180, w: 14, h: 24, name: '星弹' },
    plate: { hp: 5, score: 280, w: 18, h: 26, name: '甲卫' }
  };

  const SCORE = {
    hit: 40, gem: 80, core: 200, part: 800, boss: 4200, stage: 2000, smash: 1.5
  };

  const STAGES = [
    {
      name: '晶原', boss: '晶甲', w: 2420, theme: 'crystal',
      ground: [[0, 540], [660, 360], [1160, 400], [1680, 740]],
      plats: [
        [180, MY, 150], [460, MY, 160], [880, MY, 170],
        [1320, MY, 180], [1760, MY, 160], [2100, MY, 140],
        [500, HY, 120], [980, HY, 140], [1480, HY, 140], [1940, HY, 130]
      ],
      ents: [
        [280, GY, 'hop', 40, 520],
        [480, GY, 'hop', 80, 540],
        [520, MY, 'crawl', 460, 620],
        [760, GY, 'rush', 700, 980],
        [900, 140, 'float', 0, 0],
        [1020, GY, 'toss', 980, 1180],
        [1120, MY, 'hop', 880, 1050],
        [1280, GY, 'plate', 1180, 1420],
        [1380, HY, 'crawl', 980, 1120],
        [1540, GY, 'hop', 1320, 1600],
        [1680, MY, 'float', 0, 0],
        [1820, GY, 'rush', 1700, 2100],
        [1960, MY, 'toss', 1760, 1920],
        [2080, HY, 'float', 0, 0],
        [2160, GY, 'plate', 2000, 2280]
      ],
      cores: [[1040, MY], [1880, HY]],
      parts: [
        { id: 'l', ox: -32, oy: -44, r: 11, hp: 10 },
        { id: 'r', ox: 32, oy: -44, r: 11, hp: 10 },
        { id: 'c', ox: 0, oy: -20, r: 13, hp: 14 }
      ]
    },
    {
      name: '矿脉', boss: '钻颚', w: 2640, theme: 'mine',
      ground: [[0, 480], [580, 300], [1000, 360], [1480, 320], [1940, 700]],
      plats: [
        [140, MY, 140], [400, MY, 150], [740, MY, 170],
        [1120, MY, 160], [1540, MY, 180], [1880, MY, 160], [2280, MY, 150],
        [320, HY, 120], [840, HY, 140], [1300, HY, 150],
        [1740, HY, 140], [2160, HY, 160]
      ],
      ents: [
        [240, GY, 'hop', 20, 460],
        [420, MY, 'crawl', 400, 550],
        [460, HY, 'float', 0, 0],
        [700, GY, 'plate', 620, 900],
        [780, MY, 'rush', 740, 910],
        [960, 120, 'float', 0, 0],
        [1140, GY, 'toss', 1000, 1280],
        [1220, MY, 'hop', 1120, 1280],
        [1360, HY, 'crawl', 1300, 1450],
        [1480, GY, 'rush', 1040, 1400],
        [1620, GY, 'plate', 1480, 1760],
        [1760, MY, 'toss', 1540, 1720],
        [1880, HY, 'float', 0, 0],
        [2040, GY, 'hop', 1940, 2300],
        [2180, MY, 'crawl', 1880, 2040],
        [2320, GY, 'rush', 1960, 2500],
        [2400, HY, 'toss', 2160, 2320]
      ],
      cores: [[1600, HY], [2200, MY]],
      parts: [
        { id: 'orb', ox: 0, oy: -36, r: 11, hp: 16, orbit: 46 },
        { id: 'jaw', ox: 0, oy: -18, r: 13, hp: 18, gated: true }
      ]
    },
    {
      name: '星门', boss: '金核', w: 2860, theme: 'gate',
      ground: [[0, 420], [520, 340], [980, 380], [1480, 300], [1920, 360], [2400, 460]],
      plats: [
        [80, MY, 130], [320, MY, 150], [640, MY, 160],
        [980, MY, 150], [1300, MY, 180], [1700, MY, 160],
        [2060, MY, 170], [2460, MY, 180], [2680, MY, 130],
        [260, HY, 120], [720, HY, 140], [1200, HY, 150],
        [1640, HY, 140], [2120, HY, 160], [2540, HY, 140]
      ],
      ents: [
        [220, GY, 'hop', 20, 400],
        [360, MY, 'float', 0, 0],
        [380, HY, 'crawl', 260, 380],
        [640, GY, 'rush', 560, 860],
        [700, MY, 'plate', 640, 800],
        [780, HY, 'float', 0, 0],
        [1060, GY, 'toss', 980, 1200],
        [1140, MY, 'hop', 980, 1130],
        [1260, HY, 'crawl', 1200, 1350],
        [1400, GY, 'plate', 1280, 1560],
        [1580, GY, 'rush', 1480, 1760],
        [1660, MY, 'toss', 1300, 1480],
        [1800, HY, 'float', 0, 0],
        [1960, GY, 'hop', 1520, 1800],
        [2140, GY, 'plate', 2000, 2300],
        [2200, MY, 'crawl', 2060, 2230],
        [2360, HY, 'float', 0, 0],
        [2500, GY, 'rush', 2420, 2740],
        [2580, MY, 'toss', 2460, 2640],
        [2700, GY, 'plate', 2420, 2820]
      ],
      cores: [[1880, MY], [2300, HY]],
      parts: [
        { id: 'ls', ox: -44, oy: -56, r: 12, hp: 14 },
        { id: 'rs', ox: 44, oy: -56, r: 12, hp: 14 },
        { id: 'core', ox: 0, oy: -26, r: 14, hp: 22, gated: true }
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
  function spdMul(spray, stage) {
    return (spray ? 1.28 : 1) * (1 + Math.max(0, stage - 1) * 0.08);
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
  function dirs8() {
    const o = [];
    let x, y;
    for (y = -1; y <= 1; y++) {
      for (x = -1; x <= 1; x++) {
        if (!x && !y) continue;
        o.push(norm8(x, y));
      }
    }
    return o;
  }
  function partHp(spec, spray) {
    return Math.max(1, (spec.hp * (spray ? 1.26 : 1)) | 0);
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (HP_MAX < 10) throw new Error('hp');
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    const h = jumpHeight();
    if (h < 74 || h > 96) throw new Error('jump height ' + h);
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('spray faster');
    if (spdMul(false, 2) <= spdMul(false, 1)) throw new Error('later faster');
    if (!WEAPONS.spread || !WEAPONS.laser || !WEAPONS.flame) throw new Error('weapons');
    if (WEAPONS.spread.n < 3) throw new Error('spread fan');
    if (WEAPONS.laser.pierce < 2) throw new Error('laser pierce');
    if (!WEAPONS.flame.bounce) throw new Error('flame bounce');
    if (WEP_ORDER.length !== 3) throw new Error('cycle 3');
    if (dirs8().length !== 8) throw new Error('8 dirs');
    if (BEST_KEY !== 'playbox-gunstar-best') throw new Error('best key');
    if (AUTO_SPEED_KEY !== 'playbox-gunstar-auto-speed') throw new Error('auto speed key');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (STAGES[0].parts.length < 2 || STAGES[2].parts.length < 3) throw new Error('weak points');
    if (partHp(STAGES[2].parts[2], true) <= partHp(STAGES[0].parts[0], false)) throw new Error('boss hp');
    let i, s;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ground.length || !s.ents.length || !s.parts.length) throw new Error('stage ' + s.name);
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
  const btnRaid = document.getElementById('btn-raid');
  const btnSpray = document.getElementById('btn-spray');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeRaid = document.getElementById('mode-raid');
  const modeSpray = document.getElementById('mode-spray');
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
  const gunLabel = document.getElementById('gun-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const chainPop = document.getElementById('chain-pop');
  const hpBar = document.getElementById('hp-bar');
  const bossWrap = document.getElementById('boss-wrap');
  const bossBar = document.getElementById('boss-bar');
  const bossNameEl = document.getElementById('boss-name');

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

  const keys = { l: false, r: false, u: false, d: false, fire: false, melee: false };
  const demo = { l: false, r: true, u: false, fire: true, melee: false, d: false };
  const autoIn = { l: false, r: false, u: false, d: false, fire: false, melee: false };
  let autoOn = false;
  let autoSpeed = 3;
  let autoOvWait = 0;
  let autoStuck = 0;
  let autoLastX = 0;
  let autoLastY = 0;
  let autoWalkDir = 1;
  let autoBackT = 0;
  let autoWepCd = 0;
  let autoWepHold = 0;
  let autoGoalX = 80;
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const mist = [];

  const G = {
    mode: 'title',
    kind: 'raid',
    t: 0,
    clock: 0,
    stage: 1,
    camX: 0,
    camY: 0,
    levelW: 2420,
    plats: [],
    ents: [],
    shots: [],
    gems: [],
    cores: [],
    player: null,
    boss: null,
    lives: LIVES,
    hp: HP_MAX,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    weapon: 'spread',
    fireCd: 0,
    meleeT: 0,
    meleeHit: false,
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
    clearT: 0,
    lock: 0,
    why: '',
    muzzle: 0,
    slash: 0,
    hurtT: 0
  };

  function isSpray() {
    return G.kind === 'spray';
  }
  function playing() {
    return G.mode === 'play';
  }
  function live() {
    return G.mode === 'play' || G.mode === 'title';
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
  function meleeHeld() {
    if (autoPlaying()) return autoIn.melee;
    return G.mode === 'title' ? demo.melee : keys.melee;
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
    shot(kind) {
      this.ensure();
      if (kind === 'laser') {
        this.beep(1480, 0.07, 'sawtooth', 0.05, 420);
        this.beep(880, 0.05, 'square', 0.028, 220);
      } else if (kind === 'spread') {
        this.noise(0.045, 0.04, 700);
        this.beep(620, 0.06, 'square', 0.04, 240);
      } else if (kind === 'flame') {
        this.noise(0.08, 0.05, 280);
        this.beep(220, 0.1, 'sawtooth', 0.045, 90);
      } else {
        this.beep(880, 0.045, 'square', 0.04, 360);
        this.noise(0.02, 0.02, 1800);
      }
    },
    melee() {
      this.ensure();
      this.beep(180, 0.05, 'sawtooth', 0.04, 90);
      this.noise(0.04, 0.03, 400);
    },
    slash() {
      this.ensure();
      this.beep(720, 0.06, 'square', 0.05, 220);
      this.beep(240, 0.08, 'sawtooth', 0.04, 80);
      this.noise(0.05, 0.04, 600);
    },
    swap() {
      this.ensure();
      this.beep(520, 0.05, 'triangle', 0.035, 880);
      this.beep(880, 0.07, 'sine', 0.03, 1320);
    },
    ping() {
      this.ensure();
      this.beep(660, 0.07, 'square', 0.05, 990);
      this.beep(990, 0.1, 'triangle', 0.042, 1320);
      this.beep(1320, 0.12, 'sine', 0.03, 1760);
    },
    gem() {
      this.ensure();
      this.beep(990, 0.05, 'sine', 0.035, 1480);
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
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    hurt() {
      this.ensure();
      this.noise(0.08, 0.045, 420);
      this.beep(220, 0.1, 'sawtooth', 0.04, 90);
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
    clang() {
      this.ensure();
      this.beep(880, 0.03, 'square', 0.03, 220);
      this.noise(0.03, 0.025, 1800);
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
    const a = isSpray();
    if (modeRaid) modeRaid.setAttribute('aria-pressed', a ? 'false' : 'true');
    if (modeSpray) modeSpray.setAttribute('aria-pressed', a ? 'true' : 'false');
  }

  function bossHpFrac() {
    const b = G.boss;
    if (!b || !b.parts) return 0;
    let hp = 0;
    let max = 0;
    let i;
    for (i = 0; i < b.parts.length; i++) {
      const p = b.parts[i];
      max += p.max;
      hp += p.dead ? 0 : p.hp;
    }
    return max ? hp / max : 0;
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      stageLabel.textContent = isSpray() ? '乱射 ' + spec.name : spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isSpray() ? '乱射' : '突袭';
      tagLabel.classList.toggle('warn', isSpray());
      tagLabel.classList.toggle('hot', !isSpray() && G.stage >= 3);
    }
    if (gunLabel) {
      gunLabel.textContent = WEP_NAME[G.weapon] || '散弹';
      gunLabel.className = 'gun ' + (G.weapon || 'spread');
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (hpBar) {
      const r = G.hp / HP_MAX;
      hpBar.style.transform = 'scaleX(' + clamp(r, 0, 1) + ')';
      hpBar.classList.toggle('low', r <= 0.34);
    }
    const bossOn = !!(playing() && G.boss && G.boss.active && !G.boss.dead);
    if (bossWrap) bossWrap.hidden = !bossOn;
    if (bossOn) {
      if (bossNameEl) bossNameEl.textContent = G.boss.name;
      if (bossBar) bossBar.style.transform = 'scaleX(' + clamp(bossHpFrac(), 0, 1) + ')';
    }
    if (autoOn) {
      if (G.mode === 'title') setHint('自动托管 · 即将开局 · A 停下', 'hot');
      else if (G.mode === 'lose') setHint('自动仍开着 · 即将再开 · A 停下', 'warn');
      else if (G.mode === 'win') setHint('自动仍开着 · 即将再开 · A 停下', 'hot');
      else if (G.boss && G.boss.active && !G.boss.dead) setHint('托管中 · 打发光的核 · A 停下', 'hot');
      else setHint('托管中 · 跑跳开火换枪 · A 停下', 'hot');
    } else if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 体力打空丢命', 'warn');
    else if (G.mode === 'win') setHint('星门粉碎 · R 再来一局', 'hot');
    else if (G.lives === 1 && G.hp <= 4) setHint('残血 · 换枪打弱点 · 近斩破甲', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('打发光的核 · 激光穿、火焰熔、近斩砸', 'hot');
    else setHint('八向开火 · Q 换枪 · Shift 近斩 · A 自动', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'GUNS';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.innerHTML = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '乱射' : '换模式';
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (panel) {
      panel.classList.remove('win', 'lose');
    }
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
      w: PW, h: PH,
      grounded: true, coyote: 0,
      squash: 1, run: 0, pose: 0
    };
  }

  function makePlat(x, y, w, base) {
    return { x: x, y: y, w: w, h: base ? 48 : 12, base: !!base };
  }

  function makeEnt(x, y, kind, a, b) {
    const k = KINDS[kind] || KINDS.hop;
    const hp = k.hp + (isSpray() && playing() ? 1 : 0);
    return {
      id: uid++,
      x: x, y: y, vx: 0, vy: 0, face: -1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b,
      t: rand(0, 1), fire: rand(0.3, 1.1),
      grounded: kind !== 'float',
      dead: false, hitN: 0,
      w: k.w, h: k.h
    };
  }

  function makeBoss(spec) {
    const parts = [];
    let i;
    for (i = 0; i < spec.parts.length; i++) {
      const s = spec.parts[i];
      const hp = partHp(s, isSpray());
      parts.push({
        id: s.id,
        ox: s.ox || 0,
        oy: s.oy || 0,
        r: s.r,
        hp: hp,
        max: hp,
        dead: false,
        orbit: s.orbit || 0,
        gated: !!s.gated,
        hitN: 0,
        ang: i * 2.1
      });
    }
    return {
      id: uid++,
      x: spec.w - 160, y: GY, vx: 0, vy: 0, face: -1,
      kind: spec.boss, name: spec.boss,
      t: 0, fire: 1.4, state: 'wait',
      grounded: true, dead: false, active: false,
      hitN: 0, w: 52, h: 64, parts: parts, hop: 0
    };
  }

  function partOpen(part) {
    if (!part.gated) return true;
    const b = G.boss;
    if (!b) return false;
    if (b.kind === '钻颚') return Math.sin(b.t * 1.6) > 0.15;
    let i;
    for (i = 0; i < b.parts.length; i++) {
      if (b.parts[i] !== part && !b.parts[i].gated && !b.parts[i].dead) return false;
    }
    return true;
  }

  function partPos(part) {
    const b = G.boss;
    let oxp = part.ox;
    let oyp = part.oy;
    if (part.orbit) {
      oxp = Math.cos(part.ang) * part.orbit;
      oyp = -28 + Math.sin(part.ang) * part.orbit * 0.55;
    }
    return { x: b.x + oxp, y: b.y + oyp };
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
    if (isSpray() && !attract) {
      for (i = 0; i < spec.ents.length; i++) {
        if (i % 2 !== 0) continue;
        const e = spec.ents[i];
        if (e[2] === 'float') continue;
        G.ents.push(makeEnt(e[0] + 44, e[1], e[2], e[3], e[4]));
      }
    }
    G.cores = [];
    if (!attract) {
      for (i = 0; i < spec.cores.length; i++) {
        const d = spec.cores[i];
        G.cores.push({ x: d[0], y: d[1] - 18, taken: false, t: 0 });
      }
    }
    G.gems = [];
    G.shots = [];
    G.boss = makeBoss(spec);
    G.checkX = 70;
    G.checkY = GY;
    G.player = makePlayer(70, GY);
    G.camX = 0;
    G.camY = 0;
    G.fireCd = 0;
    G.meleeT = 0;
    G.meleeHit = false;
    G.deadT = 0;
    G.invuln = attract ? 99 : 0.45;
    G.clearT = 0;
    G.lock = 0;
    G.jumpBuf = 0;
    G.muzzle = 0;
    G.slash = 0;
    G.hurtT = 0;
    if (!attract) {
      particles.length = 0;
      sparks.length = 0;
      rings.length = 0;
      floats.length = 0;
    }
    seedMist(spec);
    syncHud();
  }

  function seedMist(spec) {
    mist.length = 0;
    const n = REDUCE ? 10 : 22;
    let i;
    for (i = 0; i < n; i++) {
      mist.push({
        x: rand(0, spec.w),
        y: rand(40, 240),
        r: rand(1, 2.4),
        a: rand(0.08, 0.28),
        s: rand(8, 22),
        rgb: i % 3 === 0 ? GOLD : (i % 3 === 1 ? CYN : MAG)
      });
    }
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
    return { x: p.x - p.w * 0.42, y: p.y - p.h, w: p.w * 0.84, h: p.h * 0.92 };
  }

  function getAim(p) {
    let dx = 0;
    let dy = 0;
    if (inL()) dx -= 1;
    if (inR()) dx += 1;
    if (inU()) dy -= 1;
    if (inD()) dy += 1;
    if (p.grounded && inU() && fireHeld() && !inL() && !inR()) {
      dx = 0;
      dy = -1;
    }
    if (p.grounded && dy > 0 && !dx) dx = p.face;
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
      for (let i = 0; i < G.shots.length && G.shots.length > 78; i++) {
        if (G.shots[i].from === 'e') {
          G.shots.splice(i, 1);
          i -= 1;
        }
      }
    }
    capArr(G.shots, 96);
  }

  function tryShoot() {
    if (G.deadT > 0 || G.lock > 0 || G.meleeT > 0) return;
    if (!(playing() || G.mode === 'title')) return;
    if (G.fireCd > 0) return;
    const wpn = WEAPONS[G.weapon] || WEAPONS.spread;
    if (countShots('p') >= wpn.max) return;
    const p = G.player;
    const aim = getAim(p);
    const ox0 = p.x + aim.dx * 16;
    const oy0 = p.y - 18 + aim.dy * 6;
    const n = wpn.n || 1;
    const fan = wpn.fan || 0;
    const base = Math.atan2(aim.dy, aim.dx);
    let i;
    for (i = 0; i < n; i++) {
      const a = n === 1 ? base : base + (i - (n - 1) / 2) * fan;
      spawnShot({
        x: ox0, y: oy0,
        vx: Math.cos(a) * wpn.spd,
        vy: Math.sin(a) * wpn.spd,
        from: 'p',
        kind: G.weapon,
        dmg: wpn.dmg,
        pierce: wpn.pierce,
        bounce: wpn.bounce,
        life: wpn.life,
        rgb: wpn.rgb,
        hit: [],
        grav: wpn.bounce ? 380 : 0
      });
    }
    G.fireCd = wpn.cd;
    G.muzzle = 0.06;
    p.pose = 0.1;
    if (playing()) audio.shot(G.weapon);
    emit(G.weapon === 'spread' ? 8 : 4, {
      x: ox0, y: oy0, j: 4,
      vx0: aim.dx * 40, vx1: aim.dx * 180,
      vy0: aim.dy * 80 - 40, vy1: aim.dy * 80 + 40,
      life: 0.16, r0: 1, r1: 2.2, rgb: wpn.rgb, g: 80
    });
    if (G.weapon === 'flame') kick(1.4, 'thump');
    else if (G.weapon === 'laser') kick(1.1, 'hit');
  }

  function tryMelee() {
    if (G.deadT > 0 || G.lock > 0 || G.meleeT > 0) return;
    if (!(playing() || G.mode === 'title')) return;
    const p = G.player;
    G.meleeT = p.grounded ? 0.22 : 0.2;
    G.meleeHit = false;
    G.slash = 0.18;
    p.pose = 0.18;
    p.squash = 0.86;
    if (playing()) audio.melee();
    emit(6, {
      x: p.x + p.face * 18, y: p.y - 14, j: 8,
      vx0: p.face * 40, vx1: p.face * 180, vy0: -80, vy1: 40,
      life: 0.18, r0: 1, r1: 2.4, rgb: MAG, g: 60
    });
  }

  function meleeBox() {
    const p = G.player;
    const reach = p.grounded ? 36 : 32;
    const x = p.face > 0 ? p.x + 4 : p.x - reach - 4;
    return { x: x, y: p.y - 28, w: reach, h: 30 };
  }

  function cycleWep(dir) {
    if (!live()) return;
    const i = WEP_ORDER.indexOf(G.weapon);
    const n = (i + dir + WEP_ORDER.length) % WEP_ORDER.length;
    setWep(WEP_ORDER[n]);
  }

  function setWep(id) {
    if (!WEAPONS[id] || G.weapon === id) {
      if (WEAPONS[id]) G.weapon = id;
      syncHud();
      return;
    }
    G.weapon = id;
    audio.swap();
    if (playing()) {
      toast(WEP_NAME[id], false, id === 'laser');
      kick(1.6, 'pickup');
    }
    syncHud();
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
      dmg: kind === 'boss' ? 3 : 2,
      pierce: 0,
      bounce: 0,
      life: 1.4,
      rgb: kind === 'boss' ? MAG : HOT,
      hit: []
    });
  }

  function fourWay(e, spd, kind) {
    enemyShoot(e, 1, 0, spd, kind);
    enemyShoot(e, -1, 0, spd, kind);
    enemyShoot(e, 0, -1, spd, kind);
    enemyShoot(e, 0, 1, spd, kind);
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

  function spawnGem(x, y) {
    G.gems.push({
      x: x, y: y, vx: rand(-50, 50), vy: rand(-180, -80),
      t: 0, taken: false, life: 6
    });
    capArr(G.gems, 24);
  }

  function killEnt(e, smash) {
    if (e.dead) return;
    e.dead = true;
    const k = KINDS[e.kind] || KINDS.hop;
    let sc = k.score * G.mult;
    if (smash) sc = (sc * SCORE.smash) | 0;
    addScore(sc);
    floatText(e.x, e.y - 22, smash ? '斩 +' + sc : '+' + sc, smash ? MAG : HOT2, smash);
    juice(e.x, e.y - 10, smash ? MAG : HOT, smash ? 1.2 : 0.85);
    audio.hit(G.combo);
    hitStop(smash ? 0.062 : 0.038);
    if (Math.random() < (smash ? 0.7 : 0.45)) spawnGem(e.x, e.y - 12);
    if (e.kind === 'plate' || e.kind === 'float') boomAt(e.x, e.y - 8, 1.05, ORG);
  }

  function hurtEnt(e, dmg, smash) {
    if (!e || e.dead) return false;
    if (e.hitN > 0 && !smash) return false;
    if (e.kind === 'plate' && !smash && G.weapon === 'spread') dmg = 1;
    e.hp -= dmg;
    e.hitN = smash ? 0.1 : 0.06;
    bumpCombo();
    addScore(Math.round(SCORE.hit * G.mult * (smash ? SCORE.smash : 1)));
    emit(4, {
      x: e.x, y: e.y - 12, j: 5,
      vx0: -80, vx1: 80, vy0: -160, vy1: -20,
      life: 0.16, r0: 1, r1: 2, rgb: WHT, g: 200
    });
    if (e.hp <= 0) {
      killEnt(e, smash);
      return true;
    }
    return false;
  }

  function hurtPart(part, dmg, smash) {
    if (!part || part.dead) return false;
    if (!partOpen(part)) {
      const pp = partPos(part);
      audio.clang();
      floatText(pp.x, pp.y - 10, '合', TEAL, false);
      return false;
    }
    if (part.hitN > 0 && !smash) return false;
    if (smash) dmg = (dmg * 1.5) | 0;
    if (G.weapon === 'laser' && !smash) dmg = (dmg * 1.5) | 0;
    part.hp -= dmg;
    part.hitN = 0.08;
    const pp = partPos(part);
    bumpCombo();
    addScore(Math.round(SCORE.hit * G.mult * (smash ? 1.4 : 1)));
    emit(8, {
      x: pp.x, y: pp.y, j: 7,
      vx0: -140, vx1: 140, vy0: -220, vy1: -20,
      life: 0.22, r0: 1.2, r1: 2.8, rgb: GOLD, g: 80
    });
    popSpark(pp.x, pp.y, GOLD, 14);
    audio.hit(G.combo);
    hitStop(smash ? 0.07 : 0.048);
    kick(smash ? 3.6 : 2.4, smash ? 'boom' : 'hit');
    if (part.hp <= 0) {
      part.dead = true;
      part.hp = 0;
      boomAt(pp.x, pp.y, 1.35, GOLD);
      addScore(SCORE.part * G.mult);
      floatText(pp.x, pp.y - 16, '核碎', GOLD, true);
      toast('弱点碎了', false, true);
      spawnGem(pp.x, pp.y);
      checkBossDead();
    }
    syncHud();
    return true;
  }

  function checkBossDead() {
    const b = G.boss;
    if (!b || b.dead) return;
    let i, liveP = 0;
    for (i = 0; i < b.parts.length; i++) if (!b.parts[i].dead) liveP += 1;
    if (liveP > 0) return;
    b.dead = true;
    b.active = true;
    bumpCombo();
    addScore(SCORE.boss * G.mult);
    boomAt(b.x, b.y - 28, 2.2, GOLD);
    juice(b.x, b.y - 20, MAG, 2);
    audio.boss();
    hitStop(0.08);
    kick(7, 'boom');
    screenFlash(GOLD, 0.5);
    toast(b.name + '粉碎', false, true);
    G.clearT = 1.6;
    addScore(SCORE.stage * G.stage);
    syncHud();
  }

  function hurtPlayer(dmg, fromX, why) {
    if (!playing() || G.deadT > 0 || G.invuln > 0) return;
    const p = G.player;
    G.hp -= dmg;
    G.hurtT = 0.28;
    G.invuln = INVULN;
    G.why = why || 'hit';
    p.vx = (p.x < fromX ? -1 : 1) * 140;
    p.vy = Math.min(p.vy, -90);
    audio.hurt();
    kick(4.2, 'die');
    screenFlash(MAG, 0.32);
    emit(10, {
      x: p.x, y: p.y - 16, j: 8,
      vx0: -80, vx1: 80, vy0: -220, vy1: -40,
      life: 0.4, r0: 1.4, r1: 3.4, rgb: MAG
    });
    if (G.hp <= 0) {
      G.hp = 0;
      loseLife(why);
    }
    syncHud();
  }

  function loseLife(why) {
    if (G.deadT > 0) return;
    G.why = why || G.why || 'hit';
    G.deadT = DIE_T;
    G.lives -= 1;
    G.combo = 0;
    G.mult = 1;
    G.player.vy = -180;
    boomAt(G.player.x, G.player.y - 16, 1.35, MAG);
    audio.death();
    hitStop(0.072);
    kick(7, 'die');
    screenFlash(MAG, 0.45);
    syncHud();
  }

  function respawn() {
    G.player = makePlayer(G.checkX, G.checkY);
    G.hp = HP_MAX;
    G.invuln = INVULN;
    G.deadT = 0;
    G.fireCd = 0.1;
    G.meleeT = 0;
    toast('重生', true, false);
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    autoOvWait = 0;
    audio.lose();
    const why = G.why === 'fall' ? '坠入裂隙了' : G.why === 'touch' ? '撞上了' : (G.why === 'life' ? '体力打空了' : '中弹了');
    showOverlay('lose', '被击碎了', why + '。连击 ×' + G.maxCombo + ' · ' + G.score + ' 分');
    syncHud();
  }

  function goWin() {
    const bonus = isSpray() ? 6000 : 8000;
    addScore(bonus);
    G.mode = 'win';
    autoOvWait = 0;
    audio.win();
    kick(4, 'win-flash');
    screenFlash(GOLD, 0.4);
    showOverlay('win', isSpray() ? '乱射清场' : '星门粉碎了',
      (isSpray() ? '乱射打穿三关。' : '突袭击碎金核。') + G.score + ' 分 · 连击 ×' + G.maxCombo);
    syncHud();
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    const keepW = G.weapon;
    const keepHp = Math.min(HP_MAX, G.hp + 4);
    loadStage(G.stage + 1, false);
    G.weapon = keepW;
    G.hp = keepHp;
    G.invuln = 1.1;
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    syncHud();
  }

  function startGame(kind) {
    G.mode = 'play';
    G.kind = kind === 'spray' ? 'spray' : 'raid';
    autoOvWait = 0;
    autoStuck = 0;
    autoBackT = 0;
    autoWalkDir = 1;
    autoWepCd = 0;
    autoWepHold = 0;
    clearAutoKeys();
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.weapon = 'spread';
    G.nextLife = LIFE_EVERY;
    G.why = '';
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast(isSpray() ? '乱射' : STAGES[0].name, false, !isSpray());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    autoOvWait = 0;
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.mult = 1;
    G.weapon = 'spread';
    loadStage(1, true);
    G.invuln = 99;
    showOverlay('title', '枪星', '八向开火，换散弹 / 激光 / 火焰。近身斩击。<br />打空弱点击碎关底巨物。');
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

  function platAboveNear(x, floorY) {
    const upY = floorY <= HY + 8 ? null : (floorY <= MY + 8 ? HY : MY);
    if (!upY) return null;
    let i, p, best = null, bestD = 1e9, d, mid;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (Math.abs(p.y - upY) > 10) continue;
      mid = p.x + p.w * 0.5;
      d = Math.abs(mid - x);
      if (p.x > x + 160 || p.x + p.w < x - 50) continue;
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best;
  }

  function clearAutoKeys() {
    autoIn.l = false;
    autoIn.r = false;
    autoIn.u = false;
    autoIn.d = false;
    autoIn.fire = false;
    autoIn.melee = false;
  }

  function autoSteer(tx) {
    autoIn.l = false;
    autoIn.r = false;
    const dx = tx - G.player.x;
    if (dx > 10) {
      autoIn.r = true;
      autoWalkDir = 1;
    } else if (dx < -10) {
      autoIn.l = true;
      autoWalkDir = -1;
    }
  }

  function autoShotThreat() {
    const p = G.player;
    let i, s, t;
    for (i = 0; i < G.shots.length; i++) {
      s = G.shots[i];
      if (s.from === 'p') continue;
      if (Math.abs(s.y - (p.y - 14)) > 24) continue;
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

  function nearestOpenPart() {
    const b = G.boss;
    if (!b || !b.active || b.dead || !b.parts) return null;
    const p = G.player;
    let i, best = null, bestD = 1e9;
    for (i = 0; i < b.parts.length; i++) {
      const part = b.parts[i];
      if (part.dead || !partOpen(part)) continue;
      const pp = partPos(part);
      const d = hypot(pp.x - p.x, pp.y - (p.y - 14));
      if (d < bestD) {
        bestD = d;
        best = { part: part, x: pp.x, y: pp.y, d: d };
      }
    }
    return best;
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
    let i, e, d, pri, dx;
    for (i = 0; i < G.cores.length; i++) {
      const u = G.cores[i];
      if (u.taken) continue;
      d = hypot(u.x - p.x, u.y - (p.y - 14));
      pri = (G.hp <= 7 ? 1000 : 380) - d * 0.42;
      if (u.x < p.x - 140) pri -= 220;
      consider(u.x, u.y + 18, pri, 'core');
    }
    for (i = 0; i < G.gems.length; i++) {
      const g = G.gems[i];
      if (g.taken) continue;
      d = hypot(g.x - p.x, g.y - (p.y - 12));
      if (d > 200) continue;
      consider(g.x, g.y + 10, 280 - d * 0.55, 'gem');
    }
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      dx = e.x - p.x;
      if (dx < -170) continue;
      if (!onScreen(e.x, e.y, 70)) continue;
      d = hypot(dx, e.y - p.y);
      pri = 640 - d * 0.52;
      if (dx > 0) pri += 90;
      if (e.kind === 'plate') pri += 50;
      if (e.kind === 'float') pri += 40;
      if (e.kind === 'rush') pri += 30;
      consider(e.x, e.y, pri, 'fight');
    }
    const part = nearestOpenPart();
    if (part) {
      const side = p.x < part.x ? -1 : 1;
      consider(part.x + side * 96, part.y + 18, 1240, 'boss');
    } else if (G.boss && G.boss.active && !G.boss.dead) {
      consider(G.boss.x - 120, G.boss.y, 920, 'boss');
    }
    if (!(G.boss && G.boss.active && !G.boss.dead)) {
      consider(G.levelW - 70, GY, 520, 'go');
    }
    if (!best) consider(Math.min(G.levelW - 40, p.x + 200), GY, 50, 'go');
    return best;
  }

  function autoWantWep(close) {
    if (G.boss && G.boss.active && !G.boss.dead) {
      const part = nearestOpenPart();
      if (part && part.d < 240) return 'laser';
      return 'flame';
    }
    if (close) {
      if (close.kind === 'plate') return 'flame';
      if (close.kind === 'float') return 'laser';
      if (close.kind === 'rush' || close.kind === 'hop') return 'spread';
    }
    let n = 0;
    let i;
    for (i = 0; i < G.ents.length; i++) {
      if (G.ents[i].dead) continue;
      if (Math.abs(G.ents[i].x - G.player.x) < 210) n += 1;
    }
    if (n >= 3) return 'spread';
    return null;
  }

  function autoThink() {
    clearAutoKeys();
    if (!autoOn || G.mode !== 'play') return;
    const p = G.player;
    if (!p || G.deadT > 0 || G.lock > 0) return;

    const moved = hypot(p.x - autoLastX, p.y - autoLastY);
    if (moved < 2.2 && p.grounded) autoStuck += STEP;
    else if (moved > 8) autoStuck = 0;
    autoLastX = p.x;
    autoLastY = p.y;
    if (autoBackT > 0) autoBackT -= STEP;
    if (autoWepCd > 0) autoWepCd -= STEP;
    autoWepHold += STEP;

    const goal = autoPick();
    autoGoalX = goal.x;
    const floorY = snapFloor(p.y);
    const tfloor = snapFloor(goal.y);
    let seekX = goal.x;
    let wantJump = false;
    let wantMelee = false;
    let wantUpAim = false;
    let wantDnAim = false;

    let i, e, close = null, closeD = 1e9;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      const d = hypot(e.x - p.x, e.y - p.y);
      if (d < closeD && d < 300) {
        closeD = d;
        close = e;
      }
    }
    const part = nearestOpenPart();

    const want = autoWantWep(close);
    if (want && want !== G.weapon && autoWepCd <= 0) {
      setWep(want);
      autoWepCd = 1.05;
      autoWepHold = 0;
    } else if (autoWepHold > 4.2 && autoWepCd <= 0) {
      cycleWep(1);
      autoWepCd = 1.25;
      autoWepHold = 0;
    }

    const shot = autoShotThreat();
    let steered = false;
    if (shot && G.invuln <= 0) {
      wantJump = true;
      autoSteer(p.x + (shot.x >= p.x ? -54 : 54));
      steered = true;
    }

    if (!steered && close && Math.abs(close.x - p.x) < 36 && Math.abs(close.y - p.y) < 30) {
      wantMelee = close.kind === 'plate' || close.kind === 'rush' || closeD < 28;
      if (close.kind === 'plate' || wantMelee) {
        autoSteer(close.x);
      } else {
        autoSteer(p.x + (close.x >= p.x ? -44 : 44));
      }
      steered = true;
    } else if (!steered && part && part.d < 44) {
      wantMelee = true;
      autoSteer(part.x);
      steered = true;
    }

    let aimX = p.x + (autoWalkDir >= 0 ? 90 : -90);
    let aimY = p.y - 16;
    if (part) {
      aimX = part.x;
      aimY = part.y;
    } else if (close) {
      aimX = close.x;
      aimY = close.y - close.h * 0.45;
    }
    const adx = aimX - p.x;
    const ady = aimY - (p.y - 16);
    if (ady < -26) wantUpAim = true;
    else if (ady > 26) wantDnAim = true;

    if (tfloor < floorY - 10) {
      const above = platAboveNear(p.x, floorY) || platCovering(p.x + 36, floorY <= MY + 8 ? HY : MY);
      if (above) {
        wantJump = true;
        seekX = above.x + above.w * 0.42;
      } else {
        wantJump = true;
      }
    }

    if (autoBackT > 0) {
      seekX = p.x - 72;
    } else if (goal.kind === 'fight' && goal.x < p.x - 40 && closeD > 70) {
      seekX = Math.min(G.levelW - 40, p.x + 180);
    }

    if (!steered) autoSteer(seekX);

    const dir = autoIn.r ? 1 : (autoIn.l ? -1 : autoWalkDir);
    if (p.grounded && pitAhead(p.x, p.y, dir)) wantJump = true;

    if (autoStuck > 0.48) wantJump = true;
    if (autoStuck > 1.7) {
      autoBackT = 0.3;
      autoStuck = 0;
      autoWalkDir = 1;
    }

    if (wantJump) {
      autoIn.u = true;
      if (!autoIn.l && !autoIn.r) {
        if (autoWalkDir >= 0) autoIn.r = true;
        else autoIn.l = true;
      }
    } else if (wantUpAim) {
      autoIn.u = true;
    }
    if (wantDnAim && !wantJump) autoIn.d = true;

    if (!autoIn.l && !autoIn.r) {
      if (adx > 10) p.face = 1;
      else if (adx < -10) p.face = -1;
    }

    autoIn.fire = !wantMelee;
    autoIn.melee = wantMelee;
  }

  function tickAutoFlow(dt) {
    if (!autoOn) return;
    if (G.mode === 'title') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.25 : 0.5)) {
        autoOvWait = 0;
        startGame(G.kind || 'raid');
      }
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.7 : 1.15)) {
        autoOvWait = 0;
        startGame(G.kind || 'raid');
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
    autoWepCd = 0;
    autoWepHold = 0;
    clearAutoKeys();
    keys.l = false;
    keys.r = false;
    keys.u = false;
    keys.d = false;
    keys.fire = false;
    keys.melee = false;
    syncAutoUi();
    if (autoOn) {
      audio.ensure();
      if (G.mode === 'title') startGame(G.kind || 'raid');
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
    demo.fire = true;
    demo.melee = ((G.t * 1.4) | 0) % 7 === 0;
    demo.u = pitAhead(p.x, p.y, 1) && p.grounded;
    demo.d = false;
    if ((G.t * 2.2) % 6 < 0.05) cycleWep(1);
    if (p.x > G.levelW - 280) {
      G.player = makePlayer(70, GY);
      G.camX = 0;
      G.weapon = 'spread';
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

    const standUp = fireHeld() && inU() && !inL() && !inR() && p.grounded;

    const spd = WALK * (p.grounded ? 1 : AIR);
    p.vx = ax * spd;
    p.x += p.vx * dt;
    p.x = clamp(p.x, 16, G.levelW - 16);
    if (G.boss && G.boss.active && !G.boss.dead) {
      const minX = G.levelW - VW + 18;
      if (p.x < minX) p.x = minX;
    }

    if (inU() && !standUp) G.jumpBuf = BUFFER;
    else G.jumpBuf -= dt;
    if (G.jumpBuf < 0) G.jumpBuf = 0;

    const canJump = (p.grounded || p.coyote > 0) && !standUp;
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

    if (p.y > VH + 90) {
      G.hp = 0;
      loseLife('fall');
    }

    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
    if (ax && p.grounded) p.run += dt * 10;
    else p.run += dt * 2;
    if (p.pose > 0) p.pose -= dt;
    if (G.hurtT > 0) G.hurtT -= dt;

    if (p.grounded && p.x > G.checkX + 80) {
      const ck = platUnder(p.x, p.y, null);
      if (ck && ck.base && p.x > ck.x + 36 && p.x < ck.x + ck.w - 36) {
        G.checkX = p.x;
        G.checkY = p.y;
      }
    }

    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.slash > 0) G.slash -= dt;

    if (G.meleeT > 0) {
      G.meleeT -= dt;
      resolveMelee();
    } else if (meleeHeld()) {
      tryMelee();
    } else if (fireHeld()) {
      tryShoot();
    }

    let i;
    for (i = 0; i < G.cores.length; i++) {
      const u = G.cores[i];
      if (u.taken) continue;
      u.t += dt;
      if (hypot(p.x - u.x, (p.y - 14) - u.y) < 20) takeCore(u);
    }
    for (i = 0; i < G.gems.length; i++) {
      const g = G.gems[i];
      if (g.taken) continue;
      if (hypot(p.x - g.x, (p.y - 12) - g.y) < 22) takeGem(g);
    }

    if (G.invuln > 0) return;

    const pb = pBox();
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      if (overlap(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.45, e.y - e.h, e.w * 0.9, e.h * 0.92)) {
        hurtPlayer(e.kind === 'rush' || e.kind === 'plate' ? 3 : 2, e.x, 'touch');
        return;
      }
    }
    if (G.boss && !G.boss.dead && G.boss.active) {
      const b = G.boss;
      if (overlap(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.42, b.y - b.h, b.w * 0.84, b.h * 0.88)) {
        hurtPlayer(3, b.x, 'touch');
      }
    }
  }

  function resolveMelee() {
    if (G.meleeHit) return;
    const p = G.player;
    const win = p.grounded ? (G.meleeT < 0.18 && G.meleeT > 0.06) : (G.meleeT < 0.16 && G.meleeT > 0.05);
    if (!win) return;
    const mb = meleeBox();
    let i, hit = false;
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      if (overlap(mb.x, mb.y, mb.w, mb.h, e.x - e.w * 0.45, e.y - e.h, e.w * 0.9, e.h)) {
        hurtEnt(e, e.kind === 'plate' ? 3 : 3, true);
        hit = true;
      }
    }
    if (G.boss && G.boss.active && !G.boss.dead) {
      for (i = 0; i < G.boss.parts.length; i++) {
        const part = G.boss.parts[i];
        if (part.dead) continue;
        const pp = partPos(part);
        if (overlap(mb.x, mb.y, mb.w, mb.h, pp.x - part.r, pp.y - part.r, part.r * 2, part.r * 2)) {
          hurtPart(part, 3, true);
          hit = true;
        }
      }
      const b = G.boss;
      if (!hit && overlap(mb.x, mb.y, mb.w, mb.h, b.x - b.w * 0.4, b.y - b.h, b.w * 0.8, b.h)) {
        audio.clang();
        floatText(b.x, b.y - 40, '甲', TEAL, false);
        hit = true;
      }
    }
    if (hit) {
      G.meleeHit = true;
      audio.slash();
      popSpark(p.x + p.face * 22, p.y - 14, MAG, 18);
    }
  }

  function takeCore(u) {
    if (u.taken) return;
    u.taken = true;
    G.hp = Math.min(HP_MAX, G.hp + 5);
    audio.ping();
    toast('星核', false, true);
    addScore(SCORE.core);
    juice(u.x, u.y, GOLD, 0.9);
    floatText(u.x, u.y - 18, '+体', GOLD, true);
    kick(2.2, 'pickup');
    syncHud();
  }

  function takeGem(g) {
    if (g.taken) return;
    g.taken = true;
    G.comboT = COMBO_WIN;
    audio.gem();
    addScore(SCORE.gem * G.mult);
    floatText(g.x, g.y - 10, '★', GOLD, false);
    emit(6, {
      x: g.x, y: g.y, j: 5,
      vx0: -60, vx1: 60, vy0: -140, vy1: -20,
      life: 0.22, r0: 1, r1: 2.2, rgb: GOLD, g: 40
    });
  }

  function onScreen(x, y, pad) {
    const m = pad || 40;
    return x > G.camX - m && x < G.camX + VW + m && y > G.camY - m && y < G.camY + VH + m;
  }

  function aimAtPlayer(e) {
    const p = G.player;
    return { dx: p.x - e.x, dy: (p.y - 16) - (e.y - e.h * 0.5) };
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    if (e.hitN > 0) e.hitN -= dt;
    e.t += dt;
    const mul = spdMul(isSpray(), G.stage);
    const p = G.player;
    if (!onScreen(e.x, e.y, 90) && e.kind !== 'float') return;

    if (e.kind === 'float') {
      e.y = (e.y < 160 ? 128 : HY - 30) + Math.sin(e.t * 2.2) * 10;
      e.face = p.x < e.x ? -1 : 1;
      e.fire -= dt;
      if (e.fire <= 0 && playing() && G.deadT <= 0 && Math.abs(p.x - e.x) < 380) {
        e.fire = (isSpray() ? 1.35 : 1.85) / mul;
        fourWay(e, 210, 'e');
      }
      return;
    }

    if (e.kind === 'crawl') {
      if (e.x < e.a) e.face = 1;
      if (e.x > e.b) e.face = -1;
      e.x += e.face * 42 * mul * dt;
      e.fire -= dt;
      if (e.fire <= 0 && playing() && G.deadT <= 0 && Math.abs(p.x - e.x) < 260) {
        e.fire = (isSpray() ? 1.2 : 1.7) / mul;
        const aim = aimAtPlayer(e);
        enemyShoot(e, aim.dx, aim.dy, 240, 'e');
      }
      return;
    }

    if (e.kind === 'toss') {
      e.face = p.x < e.x ? -1 : 1;
      e.fire -= dt;
      if (e.fire <= 0 && playing() && G.deadT <= 0 && Math.abs(p.x - e.x) < 340) {
        e.fire = (isSpray() ? 1.3 : 1.75) / mul;
        spawnShot({
          x: e.x, y: e.y - 16,
          vx: e.face * 150,
          vy: -260,
          from: 'e', kind: 'star', dmg: 2, pierce: 0, bounce: 0,
          life: 1.7, rgb: GOLD, hit: [], grav: 520
        });
      }
      if (e.x < e.a) e.face = 1;
      if (e.x > e.b) e.face = -1;
      e.x += e.face * 36 * mul * dt;
      return;
    }

    const walk = (e.kind === 'rush' ? 96 : (e.kind === 'plate' ? 40 : 52)) * mul;
    if ((e.kind === 'rush' || e.kind === 'hop') && Math.abs(p.x - e.x) < 240 && playing()) {
      e.face = p.x < e.x ? -1 : 1;
    } else {
      if (e.x < e.a) e.face = 1;
      if (e.x > e.b) e.face = -1;
    }
    const step = walk * (e.kind === 'rush' && Math.abs(p.x - e.x) < 220 ? 1.4 : 1) * dt;
    if (!standAt(e.x + e.face * 12, e.y) && standAt(e.x, e.y)) e.face *= -1;
    else e.x += e.face * step;

    if (e.kind === 'hop' && standAt(e.x, GY)) {
      e.y = GY + Math.min(0, Math.sin(e.t * 6) * 8);
    }

    e.fire -= dt;
    if (e.kind === 'hop' && e.fire <= 0 && playing() && G.deadT <= 0) {
      if (Math.abs(p.x - e.x) < 300 && Math.abs(p.y - e.y) < 80) {
        e.fire = (isSpray() ? 1.15 : 1.6) / mul;
        e.face = p.x < e.x ? -1 : 1;
        const aim = aimAtPlayer(e);
        enemyShoot(e, aim.dx, aim.dy * 0.4, 250, 'e');
      } else e.fire = 0.4;
    }
    if (e.kind === 'plate' && e.fire <= 0 && playing() && G.deadT <= 0) {
      if (Math.abs(p.x - e.x) < 320) {
        e.fire = (isSpray() ? 1.6 : 2.1) / mul;
        fourWay(e, 190, 'e');
      } else e.fire = 0.5;
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    if (eHitN(b)) b.hitN -= dt;
    b.t += dt;
    const p = G.player;
    if (!b.active) {
      if (playing() && p.x > G.levelW - 430) {
        b.active = true;
        b.state = 'intro';
        b.fire = 1.1;
        toast(b.name + ' · 打发光的核', false, true);
        audio.boss();
        kick(4, 'thump');
        syncHud();
      }
      return;
    }
    b.hop = Math.sin(b.t * 2.2) * 6;
    let i;
    for (i = 0; i < b.parts.length; i++) {
      const part = b.parts[i];
      if (part.hitN > 0) part.hitN -= dt;
      if (part.orbit) part.ang += dt * (1.15 + (isSpray() ? 0.25 : 0));
    }
    const mul = spdMul(isSpray(), G.stage);
    b.face = p.x < b.x ? -1 : 1;
    const home = G.levelW - 150;
    b.x += (home - b.x) * Math.min(1, dt * 1.4);
    b.x += Math.sin(b.t * 0.9) * 18 * dt;

    b.fire -= dt;
    if (b.fire > 0 || !playing() || G.deadT > 0) return;

    if (b.kind === '晶甲') {
      b.fire = (isSpray() ? 1.05 : 1.4) / mul;
      const aim = { dx: p.x - b.x, dy: (p.y - 16) - (b.y - 28) };
      enemyShoot(b, aim.dx, aim.dy, 240, 'boss');
      enemyShoot(b, aim.dx, aim.dy - 40, 230, 'boss');
      enemyShoot(b, aim.dx, aim.dy + 40, 230, 'boss');
      if (bossHpFrac() < 0.45) fourWay(b, 200, 'boss');
    } else if (b.kind === '钻颚') {
      b.fire = (isSpray() ? 0.95 : 1.25) / mul;
      if (partOpen(b.parts[1] || b.parts[0])) {
        fourWay(b, 220, 'boss');
        spawnShot({
          x: b.x, y: b.y - 20, vx: b.face * 80, vy: -280,
          from: 'e', kind: 'star', dmg: 3, pierce: 0, bounce: 0,
          life: 1.6, rgb: MAG, hit: [], grav: 480
        });
      } else {
        enemyShoot(b, p.x - b.x, (p.y - 16) - (b.y - 24), 260, 'boss');
      }
    } else {
      b.fire = (isSpray() ? 0.85 : 1.15) / mul;
      fourWay(b, 230, 'boss');
      const aim = { dx: p.x - b.x, dy: (p.y - 16) - (b.y - 30) };
      enemyShoot(b, aim.dx, aim.dy, 280, 'boss');
      if (bossHpFrac() < 0.4) {
        enemyShoot(b, -1, -0.4, 240, 'boss');
        enemyShoot(b, 1, -0.4, 240, 'boss');
        enemyShoot(b, 0, -1, 260, 'boss');
      }
    }
  }

  function eHitN(b) {
    return b.hitN > 0;
  }

  function shotHitsPlat(s) {
    if (s.kind === 'laser') return null;
    const plat = platUnder(s.x, s.y, null);
    if (plat && s.y >= plat.y - 4 && s.y <= plat.y + 10) return plat;
    return null;
  }

  function updateShots(dt) {
    let i, s;
    for (i = 0; i < G.shots.length; i++) {
      s = G.shots[i];
      if (s.life <= 0) continue;
      s.life -= dt;
      if (s.grav) s.vy += s.grav * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.x < G.camX - 40 || s.x > G.camX + VW + 40 || s.y < -40 || s.y > VH + 60) {
        s.life = 0;
        continue;
      }
      const plat = shotHitsPlat(s);
      if (plat) {
        if (s.bounce && s.vy > 0) {
          s.y = plat.y - 3;
          s.vy = -Math.abs(s.vy) * 0.62;
          s.vx *= 0.92;
        } else {
          s.life = 0;
          emit(3, {
            x: s.x, y: s.y, j: 3,
            vx0: -40, vx1: 40, vy0: -80, vy1: -10,
            life: 0.12, r0: 1, r1: 1.8, rgb: s.rgb, g: 40
          });
          continue;
        }
      }
      if (s.from === 'p') {
        resolvePlayerShot(s);
      } else if (playing() && G.deadT <= 0 && G.invuln <= 0) {
        const pb = pBox();
        const r = s.kind === 'star' ? 7 : 5;
        if (overlap(s.x - r, s.y - r, r * 2, r * 2, pb.x, pb.y, pb.w, pb.h)) {
          s.life = 0;
          hurtPlayer(s.dmg || 2, s.x, 'hit');
        }
      }
    }
    G.shots = G.shots.filter(function (q) { return q.life > 0; });
  }

  function resolvePlayerShot(s) {
    let i;
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      if (s.hit.indexOf(e.id) >= 0) continue;
      if (overlap(s.x - 4, s.y - 4, 8, 8, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) {
        s.hit.push(e.id);
        let dmg = s.dmg;
        if (e.kind === 'plate' && s.kind === 'spread') dmg = 1;
        if (e.kind === 'plate' && s.kind === 'flame') dmg = 2;
        hurtEnt(e, dmg, false);
        if (s.kind === 'flame') {
          /* keep burning */
        } else if (s.pierce > 0) {
          s.pierce -= 1;
        } else {
          s.life = 0;
          return;
        }
      }
    }
    if (G.boss && G.boss.active && !G.boss.dead) {
      const b = G.boss;
      for (i = 0; i < b.parts.length; i++) {
        const part = b.parts[i];
        if (part.dead) continue;
        if (s.hit.indexOf('p' + part.id) >= 0) continue;
        const pp = partPos(part);
        if (hypot(s.x - pp.x, s.y - pp.y) < part.r + 5) {
          s.hit.push('p' + part.id);
          hurtPart(part, s.dmg, false);
          if (s.pierce > 0) s.pierce -= 1;
          else if (s.kind !== 'flame') s.life = 0;
          return;
        }
      }
      if (overlap(s.x - 4, s.y - 4, 8, 8, b.x - b.w * 0.45, b.y - b.h, b.w * 0.9, b.h)) {
        if (s.hit.indexOf('body') >= 0) return;
        s.hit.push('body');
        if (s.kind === 'flame') {
          let near = null;
          let best = 9999;
          for (i = 0; i < b.parts.length; i++) {
            if (b.parts[i].dead || !partOpen(b.parts[i])) continue;
            const pp = partPos(b.parts[i]);
            const d = hypot(s.x - pp.x, s.y - pp.y);
            if (d < best) { best = d; near = b.parts[i]; }
          }
          if (near) hurtPart(near, 1, false);
        } else {
          audio.clang();
          floatText(s.x, s.y - 8, '甲', TEAL, false);
          emit(3, {
            x: s.x, y: s.y, j: 4,
            vx0: -50, vx1: 50, vy0: -80, vy1: -10,
            life: 0.12, r0: 1, r1: 1.8, rgb: CYN, g: 20
          });
        }
        if (s.kind !== 'laser' && s.kind !== 'flame') s.life = 0;
      }
    }
  }

  function updateGems(dt) {
    let i;
    for (i = 0; i < G.gems.length; i++) {
      const g = G.gems[i];
      if (g.taken) continue;
      g.t += dt;
      g.life -= dt;
      g.vy += 520 * dt;
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      const plat = landOn(g.x, g.y - 4, g.y, null);
      if (plat && g.vy > 0) {
        g.y = plat.y - 2;
        g.vy = 0;
        g.vx *= 0.8;
      }
      if (g.life <= 0) g.taken = true;
    }
    for (i = 0; i < G.cores.length; i++) G.cores[i].t += dt;
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
  }

  function updateCam(dt) {
    const p = G.player;
    let tx = p.x - VW * 0.34;
    if (G.boss && G.boss.active) tx = G.levelW - VW;
    tx = clamp(tx, 0, Math.max(0, G.levelW - VW));
    G.camX = lerp(G.camX, tx, 1 - Math.pow(0.0008, dt));
    G.camY = 0;
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (autoOn) tickAutoFlow(dt);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0008, dt));
    if (G.toastT > 0) G.toastT -= dt;

    updateFx(dt);

    if (G.stop > 0 && !(autoOn && autoSpeed >= 4 && G.mode === 'play')) {
      G.stop -= dt;
      return;
    }
    if (autoOn && autoSpeed >= 4) G.stop = 0;

    if (G.mode === 'title') demoThink();
    if (autoOn && G.mode === 'play' && G.deadT <= 0) autoThink();

    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
    if (G.invuln > 0 && G.mode === 'play') G.invuln -= dt;

    if (!live()) return;

    updatePlayer(dt);
    updateShots(dt);
    let i;
    for (i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt);
    updateBoss(dt);
    updateGems(dt);
    updateCam(dt);

    if (playing() && G.boss && G.boss.dead && G.clearT > 0) {
      G.clearT -= dt;
      if (G.clearT <= 0) nextStage();
    }
  }

  function drawSky() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const theme = spec.theme;
    let a, b, c;
    if (theme === 'mine') {
      a = '#160610'; b = '#2a0820'; c = '#08040c';
    } else if (theme === 'gate') {
      a = '#060818'; b = '#101838'; c = '#04060e';
    } else {
      a = '#081018'; b = '#142438'; c = '#0a0c10';
    }
    const g = ctx.createLinearGradient(0, oy, 0, oy + VH * scale);
    g.addColorStop(0, a);
    g.addColorStop(0.55, b);
    g.addColorStop(1, c);
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
  }

  function drawBackdrop() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    let i;
    for (i = 0; i < mist.length; i++) {
      const m = mist[i];
      const px = m.x - G.camX * 0.35;
      ctx.fillStyle = rgba(m.rgb, m.a);
      ctx.beginPath();
      ctx.arc(sx(px + Math.sin(G.t * 0.4 + i) * m.s), sy(m.y), m.r * scale, 0, TAU);
      ctx.fill();
    }
    const par = 0.45;
    for (i = 0; i < 9; i++) {
      const x = ((i * 310 - G.camX * par) % (VW + 80)) - 20;
      const h = 40 + (hash2(i + spec.w) * 70);
      ctx.fillStyle = spec.theme === 'mine'
        ? 'rgba(80,20,50,0.35)'
        : spec.theme === 'gate'
          ? 'rgba(30,40,90,0.35)'
          : 'rgba(20,50,70,0.32)';
      ctx.fillRect(ox + x * scale, oy + (VH - 40 - h) * scale, 70 * scale, h * scale);
      ctx.fillStyle = rgba(spec.theme === 'mine' ? MAG : (spec.theme === 'gate' ? CYN : GOLD), 0.18);
      ctx.beginPath();
      ctx.moveTo(ox + (x + 18) * scale, oy + (VH - 40 - h) * scale);
      ctx.lineTo(ox + (x + 36) * scale, oy + (VH - 40 - h - 28) * scale);
      ctx.lineTo(ox + (x + 54) * scale, oy + (VH - 40 - h) * scale);
      ctx.fill();
    }
  }

  function drawPlats() {
    let i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      const x = sx(p.x);
      const y = sy(p.y);
      const w = p.w * scale;
      if (x + w < ox || x > ox + VW * scale) continue;
      if (p.base) {
        ctx.fillStyle = 'rgba(18, 12, 8, 0.95)';
        ctx.fillRect(x, y, w, Math.max(8, (VH - (p.y - G.camY)) * scale));
        ctx.fillStyle = rgba(HOT, 0.55);
        ctx.fillRect(x, y, w, 3 * scale);
        ctx.fillStyle = rgba(GOLD, 0.28);
        ctx.fillRect(x, y + 3 * scale, w, 2 * scale);
        let k;
        for (k = 18; k < p.w - 10; k += 46) {
          ctx.fillStyle = rgba(CYN, 0.16);
          ctx.beginPath();
          ctx.moveTo(sx(p.x + k), y);
          ctx.lineTo(sx(p.x + k + 8), y - 10 * scale);
          ctx.lineTo(sx(p.x + k + 16), y);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = 'rgba(28, 18, 12, 0.86)';
        ctx.fillRect(x, y, w, 10 * scale);
        ctx.fillStyle = rgba(MAG, 0.45);
        ctx.fillRect(x, y, w, 2.4 * scale);
      }
    }
  }

  function drawShot(s) {
    const x = sx(s.x);
    const y = sy(s.y);
    if (s.kind === 'laser') {
      ctx.strokeStyle = rgba(CYN, 0.95);
      ctx.lineWidth = 3.2 * scale;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - s.vx * 0.03 * scale, y - s.vy * 0.03 * scale);
      ctx.stroke();
      ctx.strokeStyle = rgba(WHT, 0.8);
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - s.vx * 0.02 * scale, y - s.vy * 0.02 * scale);
      ctx.stroke();
    } else if (s.kind === 'flame') {
      ctx.fillStyle = rgba(HOT, 0.7);
      ctx.beginPath();
      ctx.arc(x, y, 5.5 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(x, y, 2.4 * scale, 0, TAU);
      ctx.fill();
    } else if (s.kind === 'spread') {
      ctx.fillStyle = rgba(LEAF, 0.95);
      ctx.beginPath();
      ctx.arc(x, y, 2.6 * scale, 0, TAU);
      ctx.fill();
    } else if (s.kind === 'star' || s.kind === 'boss') {
      ctx.fillStyle = rgba(s.rgb, 0.95);
      starPath(x, y, 5.5 * scale);
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.beginPath();
      ctx.arc(x, y, 3.2 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function starPath(x, y, r) {
    ctx.beginPath();
    let i;
    for (i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 4;
      const rr = i % 2 ? r * 0.42 : r;
      const px = x + Math.cos(a) * rr;
      const py = y + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function drawGem(g) {
    if (g.taken) return;
    const x = sx(g.x);
    const y = sy(g.y + Math.sin(g.t * 8) * 2);
    ctx.fillStyle = rgba(GOLD, 0.95);
    starPath(x, y, 5 * scale);
    ctx.fill();
  }

  function drawCore(u) {
    if (u.taken) return;
    const x = sx(u.x);
    const y = sy(u.y + Math.sin(u.t * 4) * 4);
    ctx.fillStyle = rgba(CYN, 0.25);
    ctx.beginPath();
    ctx.arc(x, y, 12 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(x, y, 6 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.arc(x - 1.5 * scale, y - 1.5 * scale, 2 * scale, 0, TAU);
    ctx.fill();
  }

  function drawGunstar(p, opt) {
    if (opt.blink && ((G.t * 18) | 0) % 2 === 0) return;
    const x = sx(p.x);
    const y = sy(p.y);
    const sc = scale * (opt.squash || 1);
    const face = p.face;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(face, 1);

    const run = Math.sin((opt.run || 0) * 1.6) * (opt.grounded ? 4 : 0);
    const bodyH = 16 * sc;
    const bodyW = 8 * sc;

    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.fillRect(-bodyW * 0.5, -bodyH - 8 * sc, bodyW, bodyH);
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.fillRect(-bodyW * 0.5, -bodyH - 8 * sc, bodyW, 3 * sc);

    ctx.fillStyle = rgba(HOT2, 0.95);
    ctx.fillRect(-5 * sc, -8 * sc + run * 0.3, 3.2 * sc, 8 * sc);
    ctx.fillRect(1.4 * sc, -8 * sc - run * 0.3, 3.2 * sc, 8 * sc);

    ctx.fillStyle = rgba(GOLD, 1);
    ctx.beginPath();
    ctx.arc(0, -bodyH - 12 * sc, 5.2 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.beginPath();
    ctx.moveTo(-5 * sc, -bodyH - 14 * sc);
    ctx.lineTo(0, -bodyH - 22 * sc);
    ctx.lineTo(5 * sc, -bodyH - 14 * sc);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.fillRect(-3.4 * sc, -bodyH - 13 * sc, 7 * sc, 2.2 * sc);

    const aim = opt.aim || { dx: face, dy: 0 };
    const ang = Math.atan2(aim.dy, aim.dx * face);
    ctx.save();
    ctx.translate(4 * sc, -16 * sc);
    ctx.rotate(ang);
    const wrgb = WEAPONS[G.weapon] ? WEAPONS[G.weapon].rgb : GOLD;
    ctx.fillStyle = rgba(wrgb, 1);
    ctx.fillRect(0, -1.3 * sc, 12 * sc, 2.6 * sc);
    if (opt.muzzle) {
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.beginPath();
      ctx.arc(13 * sc, 0, 4 * sc, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    if (opt.slash) {
      ctx.strokeStyle = rgba(MAG, 0.85);
      ctx.lineWidth = 2.4 * scale;
      ctx.beginPath();
      ctx.arc(10 * sc, -14 * sc, 16 * sc, -0.9, 0.9);
      ctx.stroke();
      ctx.strokeStyle = rgba(GOLD, 0.7);
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.arc(10 * sc, -14 * sc, 12 * sc, -0.7, 0.8);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawEnt(e) {
    if (e.dead) return;
    if (!onScreen(e.x, e.y, 20)) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const flash = e.hitN > 0;
    const sc = scale;
    if (e.kind === 'float') {
      ctx.fillStyle = rgba(flash ? WHT : CYN, 0.9);
      ctx.beginPath();
      ctx.arc(x, y - 8 * sc, 9 * sc, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(x, y - 8 * sc, 3.4 * sc, 0, TAU);
      ctx.fill();
      return;
    }
    if (e.kind === 'crawl') {
      ctx.fillStyle = rgba(flash ? WHT : MAG, 0.92);
      ctx.beginPath();
      ctx.ellipse(x, y - 6 * sc, 10 * sc, 6 * sc, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.8);
      ctx.fillRect(x - 8 * sc, y - 8 * sc, 3 * sc, 8 * sc);
      ctx.fillRect(x + 5 * sc, y - 8 * sc, 3 * sc, 8 * sc);
      return;
    }
    if (e.kind === 'rush') {
      ctx.fillStyle = rgba(flash ? WHT : LEAF, 0.92);
      ctx.beginPath();
      ctx.ellipse(x, y - 8 * sc, 12 * sc, 8 * sc, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.beginPath();
      ctx.moveTo(x + e.face * 12 * sc, y - 8 * sc);
      ctx.lineTo(x + e.face * 20 * sc, y - 4 * sc);
      ctx.lineTo(x + e.face * 12 * sc, y - 2 * sc);
      ctx.fill();
      return;
    }
    if (e.kind === 'plate') {
      ctx.fillStyle = rgba(flash ? WHT : TEAL, 0.92);
      ctx.fillRect(x - 9 * sc, y - 24 * sc, 18 * sc, 24 * sc);
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.fillRect(x - 9 * sc, y - 24 * sc, 18 * sc, 3 * sc);
      ctx.fillStyle = rgba(HOT, 0.85);
      ctx.fillRect(x - 3 * sc, y - 16 * sc, 6 * sc, 6 * sc);
      return;
    }
    ctx.fillStyle = rgba(flash ? WHT : PUR, 0.92);
    ctx.fillRect(x - 6 * sc, y - 20 * sc, 12 * sc, 14 * sc);
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.beginPath();
    ctx.arc(x, y - 24 * sc, 5 * sc, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.9);
    ctx.fillRect(x - 6 * sc, y - 8 * sc, 5 * sc, 8 * sc);
    ctx.fillRect(x + 1 * sc, y - 8 * sc, 5 * sc, 8 * sc);
    if (e.kind === 'toss') {
      ctx.fillStyle = rgba(GOLD, 0.9);
      starPath(x + e.face * 8 * sc, y - 16 * sc, 4 * sc);
      ctx.fill();
    }
  }

  function drawBoss() {
    const b = G.boss;
    if (!b || b.dead) return;
    if (!onScreen(b.x, b.y, 80) && !b.active) return;
    const x = sx(b.x);
    const y = sy(b.y + (b.hop || 0));
    const sc = scale;
    const flash = b.hitN > 0;

    ctx.fillStyle = rgba(flash ? WHT : HOT, 0.95);
    ctx.beginPath();
    ctx.ellipse(x, y - 28 * sc, 30 * sc, 24 * sc, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.55);
    ctx.fillRect(x - 26 * sc, y - 48 * sc, 52 * sc, 10 * sc);
    ctx.fillStyle = 'rgba(8,6,4,0.85)';
    ctx.fillRect(x - 22 * sc, y - 22 * sc, 44 * sc, 22 * sc);

    if (b.kind === '钻颚') {
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.beginPath();
      ctx.moveTo(x - 18 * sc, y - 12 * sc);
      ctx.lineTo(x, y + 6 * sc);
      ctx.lineTo(x + 18 * sc, y - 12 * sc);
      ctx.fill();
    }
    if (b.kind === '金核') {
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(x - 38 * sc, y - 62 * sc, 18 * sc, 16 * sc);
      ctx.fillRect(x + 20 * sc, y - 62 * sc, 18 * sc, 16 * sc);
    }

    let i;
    for (i = 0; i < b.parts.length; i++) {
      const part = b.parts[i];
      if (part.dead) continue;
      const open = partOpen(part);
      const pp = partPos(part);
      const px = sx(pp.x);
      const py = sy(pp.y + (b.hop || 0));
      const a = open ? (0.7 + 0.3 * Math.sin(G.t * 8 + i)) : 0.28;
      ctx.fillStyle = rgba(part.hitN > 0 ? WHT : (open ? GOLD : TEAL), a);
      ctx.beginPath();
      ctx.arc(px, py, part.r * sc, 0, TAU);
      ctx.fill();
      if (open) {
        ctx.fillStyle = rgba(CYN, 0.95);
        starPath(px, py, part.r * 0.55 * sc);
        ctx.fill();
      } else {
        ctx.strokeStyle = rgba(TEAL, 0.7);
        ctx.lineWidth = 1.4 * sc;
        ctx.beginPath();
        ctx.arc(px, py, part.r * 0.7 * sc, 0, TAU);
        ctx.stroke();
      }
    }
  }

  function drawBossBar() {
    const b = G.boss;
    if (!b || !b.active || b.dead || !playing()) return;
    const x = ox + 80 * scale;
    const y = oy + 12 * scale;
    const w = (VW - 160) * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(GOLD, 0.92);
    ctx.fillRect(x, y, w * clamp(bossHpFrac(), 0, 1), 8 * scale);
    ctx.strokeStyle = rgba(HOT, 0.55);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(WHT, 0.85);
    ctx.font = (10 * scale) + 'px sans-serif';
    ctx.textAlign = 'left';
    let liveP = 0;
    let i;
    for (i = 0; i < b.parts.length; i++) if (!b.parts[i].dead) liveP += 1;
    ctx.fillText(b.name + '  核 ' + liveP + '/' + b.parts.length, x, y - 3 * scale);
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
    ctx.fillStyle = '#0e0804';
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
    drawPlats();

    let i;
    for (i = 0; i < G.cores.length; i++) drawCore(G.cores[i]);
    for (i = 0; i < G.gems.length; i++) drawGem(G.gems[i]);
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawBoss();
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);

    if (G.player && G.deadT <= 0) {
      drawGunstar(G.player, {
        run: G.player.run,
        grounded: G.player.grounded,
        squash: G.player.squash,
        aim: getAim(G.player),
        muzzle: G.muzzle > 0,
        slash: G.slash > 0,
        blink: G.invuln > 0 && G.mode === 'play'
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
    const shift = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight';
    const meleeKey = shift || k === 'z' || k === 'Z';
    const tab = k === 'Tab' || code === 'Tab';

    if (!autoOn) {
      if (k === 'ArrowLeft' || k === 'Left') keys.l = down;
      if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
      if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
      if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
      if (space) keys.fire = down;
      if (meleeKey) keys.melee = down;
    } else if (down && (isMove || space || meleeKey)) {
      e.preventDefault();
    }

    if (down && (isMove || space || k === 'Enter' || tab || meleeKey || k === 'q' || k === 'Q' || k === 'c' || k === 'C')) {
      e.preventDefault();
    }
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
    if (autoOn) return;
    if (tab || k === 'q' || k === 'Q' || k === 'c' || k === 'C' || k === 'e' || k === 'E') {
      if (!overlayOpen()) cycleWep(1);
      return;
    }
    if (k === '1') {
      if (G.mode === 'title') startGame('raid');
      else if (!overlayOpen()) setWep('spread');
      return;
    }
    if (k === '2') {
      if (G.mode === 'title') startGame('spray');
      else if (!overlayOpen()) setWep('laser');
      return;
    }
    if (k === '3' && !overlayOpen()) {
      setWep('flame');
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
    hold(document.getElementById('btn-fire'), function () { keys.fire = true; }, function () { keys.fire = false; });
    hold(document.getElementById('btn-melee'), function () { keys.melee = true; }, function () { keys.melee = false; });
    const swap = document.getElementById('btn-swap');
    if (swap) {
      swap.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        if (autoOn) return;
        audio.ensure();
        cycleWep(1);
      });
    }
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

  if (btnRaid) {
    btnRaid.addEventListener('click', function () {
      audio.ensure();
      startGame('raid');
    });
  }
  if (btnSpray) {
    btnSpray.addEventListener('click', function () {
      audio.ensure();
      startGame('spray');
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
      if (G.mode === 'win') startGame('spray');
      else goTitle();
    });
  }
  if (modeRaid) {
    modeRaid.addEventListener('click', function () {
      audio.ensure();
      startGame('raid');
    });
  }
  if (modeSpray) {
    modeSpray.addEventListener('click', function () {
      audio.ensure();
      startGame('spray');
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
      keys.melee = false;
    }
  });

  requestAnimationFrame(frame);
})();
