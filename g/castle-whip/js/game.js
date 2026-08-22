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
  const WALK = 126;
  const JUMP_V = 420;
  const GRAV = 1100;
  const MAX_FALL = 520;
  const COYOTE = 0.05;
  const BUFFER = 0.1;
  const PW = 14;
  const PH = 26;
  const MAX_HP = 8;
  const WHIP_T = 0.3;
  const SUB_CD = 0.38;
  const INVULN = 1.18;
  const DIE_T = 0.86;
  const BEST_KEY = 'playbox-castle-whip-best';
  const MUTE_KEY = 'playbox-castle-whip-mute';
  const OPS = '方向键 / WASD 走跳爬梯 · 空格挥鞭 · Z 副武器 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [180, 76, 255];
  const HOT2 = [208, 128, 255];
  const WHT = [246, 243, 239];
  const LEAF = [61, 255, 122];
  const ORG = [255, 154, 58];
  const GRN = [90, 210, 110];
  const STN = [150, 140, 170];

  const WHIPS = [
    { len: 34, name: '皮鞭' },
    { len: 56, name: '锁链' },
    { len: 82, name: '晨星' }
  ];
  const SUB_NAME = { knife: '飞刀', axe: '斧', water: '圣水', '': '—' };
  const SUB_COST = { knife: 1, axe: 1, water: 1 };
  const SCORE = {
    zombie: 100, bat: 150, knight: 250, medusa: 200,
    candle: 80, boss: 4200, stage: 1800, whip: 400, meat: 200
  };

  const STAGES = [
    {
      name: '回廊', boss: '石像', w: 2320, hp: 16, theme: 'hall',
      ground: [[0, 540], [620, 360], [1100, 380], [1620, 700]],
      plats: [
        [340, MY, 180], [700, MY, 186], [1080, MY, 170], [1480, MY, 190], [1900, MY, 150],
        [420, HY, 130], [920, HY, 140], [1540, HY, 130]
      ],
      stairs: [
        [360, GY, 432, MY],
        [860, MY, 932, HY],
        [1200, GY, 1128, MY],
        [1540, GY, 1612, MY]
      ],
      candles: [
        [180, GY - 30, 'heart'], [310, GY - 30, 'heart'],
        [470, MY - 30, 'whip'], [640, GY - 30, 'heart'],
        [980, HY - 30, 'heart5'], [1100, MY - 30, 'knife'],
        [1180, GY - 30, 'heart'], [1360, MY - 30, 'heart'],
        [1580, MY - 30, 'meat'], [1780, GY - 30, 'heart'],
        [1980, MY - 30, 'heart5'], [2140, GY - 30, 'heart']
      ],
      ents: [
        [250, GY, 'zombie', 40, 500],
        [430, GY, 'zombie', 40, 520],
        [500, MY, 'bat', 340, 520],
        [780, GY, 'zombie', 640, 960],
        [860, HY, 'bat', 760, 980],
        [1160, GY, 'zombie', 1100, 1460],
        [1280, MY, 'bat', 1080, 1250],
        [1500, GY, 'zombie', 1480, 1980],
        [1720, MY, 'knight', 1480, 1670],
        [1960, GY, 'zombie', 1640, 2200],
        [2060, MY, 'bat', 1900, 2050]
      ]
    },
    {
      name: '钟楼', boss: '美杜莎', w: 2600, hp: 22, theme: 'tower',
      ground: [[0, 480], [560, 300], [980, 340], [1460, 320], [1960, 640]],
      plats: [
        [160, MY, 150], [420, MY, 170], [760, MY, 180], [1120, MY, 160],
        [1480, MY, 190], [1860, MY, 170], [2240, MY, 150],
        [280, HY, 130], [700, HY, 150], [1180, HY, 150], [1640, HY, 140], [2070, HY, 160]
      ],
      stairs: [
        [180, GY, 252, MY],
        [452, MY, 380, HY],
        [844, GY, 772, MY],
        [1160, MY, 1232, HY],
        [1540, GY, 1612, MY],
        [2010, MY, 2082, HY],
        [2324, GY, 2252, MY]
      ],
      candles: [
        [140, GY - 30, 'heart'], [220, MY - 30, 'heart'],
        [340, HY - 30, 'whip'], [500, MY - 30, 'heart5'],
        [900, GY - 30, 'axe'], [1200, MY - 30, 'heart'],
        [1260, HY - 30, 'heart5'], [1500, GY - 30, 'heart'],
        [1560, MY - 30, 'meat'], [1720, HY - 30, 'heart'],
        [1920, MY - 30, 'heart5'], [2400, GY - 30, 'heart']
      ],
      ents: [
        [220, GY, 'zombie', 20, 450],
        [400, MY, 'knight', 420, 590],
        [520, HY, 'bat', 280, 410],
        [700, GY, 'zombie', 580, 940],
        [860, MY, 'knight', 760, 940],
        [1040, GY, 'zombie', 980, 1280],
        [1240, HY, 'bat', 1180, 1330],
        [1400, MY, 'knight', 1120, 1280],
        [1580, GY, 'zombie', 1480, 1760],
        [1760, MY, 'knight', 1480, 1670],
        [1980, GY, 'zombie', 1980, 2480],
        [2140, HY, 'bat', 2080, 2230],
        [2320, MY, 'knight', 2240, 2390]
      ]
    },
    {
      name: '王座', boss: '魔王', w: 2880, hp: 30, theme: 'throne',
      ground: [[0, 440], [520, 320], [980, 360], [1480, 300], [1960, 340], [2440, 440]],
      plats: [
        [120, MY, 150], [380, MY, 160], [700, MY, 170], [1040, MY, 170],
        [1400, MY, 180], [1780, MY, 170], [2160, MY, 180], [2560, MY, 160],
        [240, HY, 130], [640, HY, 140], [1100, HY, 150], [1560, HY, 140],
        [2020, HY, 150], [2480, HY, 140]
      ],
      stairs: [
        [140, GY, 212, MY],
        [430, MY, 358, HY],
        [792, GY, 720, MY],
        [1080, MY, 1152, HY],
        [1460, GY, 1532, MY],
        [2172, MY, 2100, HY],
        [2220, GY, 2292, MY],
        [2600, MY, 2528, HY]
      ],
      candles: [
        [160, GY - 30, 'heart'], [200, MY - 30, 'whip'],
        [300, HY - 30, 'heart5'], [780, MY - 30, 'water'],
        [980, GY - 30, 'heart'], [1180, HY - 30, 'axe'],
        [1480, MY - 30, 'heart5'], [1680, GY - 30, 'meat'],
        [2100, HY - 30, 'knife'], [2240, MY - 30, 'heart'],
        [2320, GY - 30, 'heart5'], [2640, MY - 30, 'heart'],
        [2720, GY - 30, 'meat']
      ],
      ents: [
        [240, GY, 'zombie', 20, 420],
        [360, MY, 'knight', 120, 270],
        [480, HY, 'bat', 240, 370],
        [680, GY, 'zombie', 540, 860],
        [820, MY, 'knight', 700, 870],
        [1120, GY, 'zombie', 980, 1320],
        [1180, HY, 'knight', 1100, 1250],
        [1360, MY, 'knight', 1400, 1580],
        [1600, GY, 'zombie', 1500, 1760],
        [1860, HY, 'bat', 1560, 1700],
        [1980, MY, 'knight', 1780, 1950],
        [2200, GY, 'zombie', 1980, 2280],
        [2340, MY, 'knight', 2160, 2340],
        [2520, HY, 'bat', 2480, 2620],
        [2640, GY, 'zombie', 2460, 2840]
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
  function spdMul(night, stage) {
    return (night ? 1.28 : 1) * (1 + Math.max(0, stage - 1) * 0.07);
  }
  function kbMul(night) {
    return night ? 1.85 : 1;
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
    if (kbMul(true) <= kbMul(false)) throw new Error('night knockback');
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('night faster');
    if (!SUB_COST.knife || !SUB_COST.axe || !SUB_COST.water) throw new Error('subs');
    if (BEST_KEY !== 'playbox-castle-whip-best') throw new Error('best key');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    let i, s;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ground.length || !s.ents.length || !s.stairs.length || !s.candles.length) {
        throw new Error('stage ' + s.name);
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
  const btnEnter = document.getElementById('btn-enter');
  const btnNight = document.getElementById('btn-night');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeEnter = document.getElementById('mode-enter');
  const modeNight = document.getElementById('mode-night');
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
  const heartLabel = document.getElementById('heart-label');
  const whipLabel = document.getElementById('whip-label');
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
    kind: 'enter',
    t: 0,
    clock: 0,
    stage: 1,
    camX: 0,
    camY: 0,
    levelW: 2320,
    plats: [],
    stairs: [],
    ents: [],
    shots: [],
    pickups: [],
    candles: [],
    player: null,
    boss: null,
    lives: LIVES,
    hp: MAX_HP,
    hearts: 5,
    whipLv: 1,
    sub: '',
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    whipT: 0,
    whipHit: {},
    subCd: 0,
    fireEdge: false,
    subEdge: false,
    checkX: 70,
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
    medT: 0,
    subFlash: 0
  };

  function isNight() {
    return G.kind === 'night';
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
      if (kind === 'axe') {
        this.beep(220, 0.1, 'sawtooth', 0.05, 90);
        this.noise(0.06, 0.04, 400);
      } else if (kind === 'water') {
        this.beep(520, 0.08, 'sine', 0.045, 180);
        this.noise(0.07, 0.04, 600);
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
    const n = isNight();
    if (modeEnter) modeEnter.setAttribute('aria-pressed', n ? 'false' : 'true');
    if (modeNight) modeNight.setAttribute('aria-pressed', n ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (hpEl) hpEl.textContent = String(Math.max(0, G.hp));
    if (hpFill) hpFill.style.transform = 'scaleX(' + clamp(G.hp / MAX_HP, 0, 1) + ')';
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      stageLabel.textContent = (isNight() ? '夜巡 ' : '') + spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isNight() ? '夜巡' : '入城';
      tagLabel.classList.toggle('warn', isNight());
      tagLabel.classList.toggle('hot', !isNight() && G.stage >= 3);
    }
    if (heartLabel) heartLabel.textContent = '心 ' + G.hearts;
    if (whipLabel) {
      const w = WHIPS[clamp(G.whipLv, 1, 3) - 1];
      whipLabel.textContent = w.name;
      whipLabel.className = 'whip' + (G.whipLv === 2 ? ' chain' : G.whipLv >= 3 ? ' star' : '');
    }
    if (subLabel) {
      subLabel.textContent = '副 ' + (SUB_NAME[G.sub] || '—');
      subLabel.className = 'subw' + (G.sub ? '' : ' off');
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 生命归零丢命，夜巡击退更狠', 'warn');
    else if (G.mode === 'win') setHint('魔王已灭 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 空格挥鞭 · Z 副武器耗心', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('头目 · ' + spec.boss, 'hot');
    else setHint('走跳爬梯 · 空格挥鞭 · 蜡烛掉心与副武器', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'VANIA';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '夜巡' : '换模式';
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
      squash: 1, run: 0, pose: 0,
      onStair: false, stair: null, st: 0
    };
  }

  function makePlat(x, y, w, base) {
    return { x: x, y: y, w: w, h: base ? 48 : 12, base: !!base };
  }

  function makeStair(x0, y0, x1, y1) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x0: x0, y0: y0, x1: x1, y1: y1, dx: dx, dy: dy, len: len };
  }

  function hpOf(kind) {
    if (kind === 'knight') return 3;
    if (kind === 'zombie') return 2;
    return 1;
  }

  function makeEnt(x, y, kind, a, b) {
    const hp = hpOf(kind);
    const fly = kind === 'bat' || kind === 'medusa';
    return {
      id: uid++,
      x: x, y: y, vx: 0, vy: 0, face: -1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b, base: y,
      t: rand(0, 2), fire: rand(0.4, 1.4),
      grounded: !fly, dead: false, hitN: 0,
      w: kind === 'knight' ? 16 : kind === 'medusa' ? 12 : 14,
      h: kind === 'knight' ? 26 : kind === 'bat' || kind === 'medusa' ? 12 : 22
    };
  }

  function makeBoss(spec) {
    const hp = (spec.hp * (isNight() ? 1.2 : 1)) | 0;
    return {
      id: uid++,
      x: spec.w - 150, y: GY, vx: 0, vy: 0, face: -1,
      hp: hp, max: hp, kind: spec.boss, name: spec.boss,
      t: 0, fire: 1.1, state: 'wait',
      grounded: true, dead: false, active: false,
      hitN: 0, w: 34, h: 44
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
      G.plats.push(makePlat(g[0], GY, g[1], true));
    }
    for (i = 0; i < spec.plats.length; i++) {
      p = spec.plats[i];
      G.plats.push(makePlat(p[0], p[1], p[2], false));
    }
    G.stairs = [];
    for (i = 0; i < spec.stairs.length; i++) {
      const s = spec.stairs[i];
      G.stairs.push(makeStair(s[0], s[1], s[2], s[3]));
    }
    G.ents = [];
    for (i = 0; i < spec.ents.length; i++) {
      const e = spec.ents[i];
      G.ents.push(makeEnt(e[0], e[1], e[2], e[3], e[4]));
    }
    if (isNight() && !attract) {
      for (i = 0; i < spec.ents.length; i++) {
        if (i % 3 !== 0) continue;
        const e = spec.ents[i];
        if (e[2] === 'knight') continue;
        G.ents.push(makeEnt(e[0] + 36, e[1], e[2] === 'zombie' ? 'bat' : e[2], e[3], e[4]));
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
    G.knockT = 0;
    G.medT = 0.8;
    G.clearT = 0;
    G.lock = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
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

  function standAt(x, y) {
    return !!platUnder(x, y, null);
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
    } else if (u.kind === 'knife' || u.kind === 'axe' || u.kind === 'water') {
      G.sub = u.kind;
      toast(SUB_NAME[u.kind], false, true);
    } else if (u.kind === 'meat') {
      G.hp = MAX_HP;
      toast('烤肉 生命回满', false, true);
      addScore(SCORE.meat * G.mult);
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

  function enemyShoot(e, dx, dy, spd, kind) {
    const len = Math.max(0.001, hypot(dx, dy));
    spawnShot({
      x: e.x, y: e.y - e.h * 0.55,
      vx: (dx / len) * spd,
      vy: (dy / len) * spd,
      from: 'e', kind: kind || 'e', dmg: 1, pierce: 0,
      life: 1.6, rgb: kind === 'fire' ? ORG : HOT2, hit: [], grav: 0
    });
  }

  function tryWhip() {
    if (G.whipT > 0 || G.knockT > 0 || G.deadT > 0) return;
    if (G.lock > 0) return;
    G.whipT = WHIP_T;
    G.whipHit = {};
    G.player.pose = 0.2;
    audio.whip();
    const p = G.player;
    emit(4, {
      x: p.x + p.face * 16, y: p.y - 16, j: 6,
      vx0: p.face * 40, vx1: p.face * 160, vy0: -40, vy1: 30,
      life: 0.16, r0: 1, r1: 2.2, rgb: CYN, g: 80
    });
  }

  function trySub() {
    if (G.subCd > 0 || G.knockT > 0 || G.deadT > 0 || G.lock > 0) return;
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
    const rgb = kind === 'axe' ? GOLD : kind === 'water' ? MAG : CYN;
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
    } else if (kind === 'axe') {
      spawnShot({
        x: p.x + p.face * 8, y: p.y - 18,
        vx: p.face * 210, vy: -390,
        from: 'p', kind: 'axe', dmg: 2, pierce: 1,
        life: 1.4, rgb: GOLD, hit: [], grav: 780, spin: 0
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

  function hurt(srcX, dmg, why) {
    if (!playing() || G.invuln > 0 || G.deadT > 0 || G.lock > 0) return;
    const p = G.player;
    G.hp -= dmg;
    if (hpBox) {
      hpBox.classList.remove('hurt');
      void hpBox.offsetWidth;
      hpBox.classList.add('hurt');
    }
    const kb = kbMul(isNight());
    p.vx = (p.x >= srcX ? 1 : -1) * 158 * kb;
    p.vy = -148 * (isNight() ? 1.32 : 1);
    p.onStair = false;
    p.stair = null;
    p.grounded = false;
    p.duck = false;
    G.knockT = isNight() ? 0.5 : 0.28;
    G.invuln = INVULN;
    G.whipT = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    audio.hurt();
    hitStop(0.06);
    kick(isNight() ? 5.4 : 3.5, 'hit');
    juice(p.x, p.y - 12, MAG, 0.85);
    syncHud();
    if (G.hp <= 0) die(why || 'hit');
  }

  function die(why) {
    if (G.deadT > 0 || G.mode !== 'play') return;
    G.why = why || 'hit';
    G.deadT = DIE_T;
    G.lives -= 1;
    G.hp = 0;
    G.whipT = 0;
    G.player.onStair = false;
    G.player.vy = -180;
    audio.death();
    hitStop(0.072);
    kick(6.2, 'die');
    juice(G.player.x, G.player.y - 12, HOT, 1.3);
    syncHud();
  }

  function respawn() {
    G.hp = MAX_HP;
    G.invuln = INVULN;
    G.deadT = 0;
    G.knockT = 0;
    G.whipT = 0;
    G.player = makePlayer(G.checkX, G.checkY);
    G.camX = clamp(G.checkX - VW * 0.4, 0, Math.max(0, G.levelW - VW));
    toast('再起', false, true);
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    const why = G.why === 'fall' ? '坠入深渊了' : G.why === 'boss' ? '被魔王击倒了' : '生命耗尽了';
    showOverlay('lose', '倒下了', why + '  分 ' + G.score + ' · 连击 ' + G.maxCombo);
    syncHud();
  }

  function goWin() {
    G.mode = 'win';
    audio.win();
    kick(4, 'win-flash');
    screenFlash(GOLD, 0.45);
    const msg = isNight()
      ? '夜巡得手。魔王在钟声里散尽。'
      : '城堡已破。入城三关全部打穿。';
    showOverlay('win', isNight() ? '夜巡得手' : '城堡已破', msg + '  分 ' + G.score);
    syncHud();
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      if (!isNight()) addScore(8000);
      goWin();
      return;
    }
    audio.stage();
    toast(STAGES[G.stage].name, false, true);
    G.stage += 1;
    const keep = {
      x: 70, lives: G.lives, hp: G.hp, hearts: G.hearts,
      whipLv: G.whipLv, sub: G.sub, score: G.score
    };
    loadStage(G.stage, false);
    G.lives = keep.lives;
    G.hp = keep.hp;
    G.hearts = keep.hearts;
    G.whipLv = keep.whipLv;
    G.sub = keep.sub;
    G.score = keep.score;
    G.invuln = 1.1;
    syncHud();
  }

  function startGame(kind) {
    audio.ensure();
    audio.start();
    G.kind = kind === 'night' ? 'night' : 'enter';
    G.mode = 'play';
    G.lives = LIVES;
    G.hp = MAX_HP;
    G.hearts = 5;
    G.whipLv = 1;
    G.sub = '';
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.nextLife = LIFE_EVERY;
    G.invuln = 0.6;
    G.deadT = 0;
    G.why = '';
    loadStage(1, false);
    hideOverlay();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'enter';
    G.lives = LIVES;
    G.hp = MAX_HP;
    G.hearts = 5;
    G.whipLv = 2;
    G.sub = 'knife';
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.invuln = 99;
    G.deadT = 0;
    loadStage(1, true);
    showOverlay('title', '城夜', '城堡里挥鞭打碎蜡烛。爬楼梯，副武器耗心。皮鞭、锁链、晨星三段，尽头魔王。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('enter');
    else startGame(G.kind || 'enter');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('enter');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function stairT(st, x, y) {
    const dx = st.x1 - st.x0;
    const dy = st.y1 - st.y0;
    const len2 = dx * dx + dy * dy || 1;
    return ((x - st.x0) * dx + (y - st.y0) * dy) / len2;
  }

  function stairPoint(st, t) {
    return { x: st.x0 + (st.x1 - st.x0) * t, y: st.y0 + (st.y1 - st.y0) * t };
  }

  function nearEnd(x, y, ex, ey, r) {
    return hypot(x - ex, y - ey) < r;
  }

  function tryMountStair(p) {
    if (p.onStair || G.whipT > 0 || G.knockT > 0) return;
    let i, st, t;
    for (i = 0; i < G.stairs.length; i++) {
      st = G.stairs[i];
      if (nearEnd(p.x, p.y, st.x0, st.y0, 16) && p.grounded) {
        if (inU()) {
          p.onStair = true;
          p.stair = st;
          p.st = 0.02;
          p.grounded = true;
          p.vy = 0;
          p.vx = 0;
          p.duck = false;
          return;
        }
      }
      if (nearEnd(p.x, p.y, st.x1, st.y1, 16) && p.grounded) {
        if (inD() || (st.dx > 0 && inL()) || (st.dx < 0 && inR())) {
          p.onStair = true;
          p.stair = st;
          p.st = 0.98;
          p.grounded = true;
          p.vy = 0;
          p.vx = 0;
          p.duck = false;
          return;
        }
      }
      t = stairT(st, p.x, p.y);
      if (t > 0.08 && t < 0.92) {
        const pt = stairPoint(st, t);
        if (hypot(p.x - pt.x, p.y - pt.y) < 12 && (inU() || inD())) {
          p.onStair = true;
          p.stair = st;
          p.st = t;
          p.grounded = true;
          p.vy = 0;
          p.vx = 0;
          return;
        }
      }
    }
  }

  function moveOnStair(p, dt) {
    const st = p.stair;
    if (!st) {
      p.onStair = false;
      return;
    }
    let dir = 0;
    if (inU()) dir += 1;
    if (inD()) dir -= 1;
    if (inR()) dir += st.dx > 0 ? 1 : -1;
    if (inL()) dir += st.dx < 0 ? 1 : -1;
    if (dir > 1) dir = 1;
    if (dir < -1) dir = -1;
    if (G.whipT > 0) dir = 0;
    const spd = 96;
    p.st += (dir * spd * dt) / st.len;
    if (p.st >= 1) {
      const top = stairPoint(st, 1);
      p.x = top.x;
      p.y = top.y;
      p.onStair = false;
      p.stair = null;
      p.grounded = true;
      p.vy = 0;
      p.vx = 0;
      return;
    }
    if (p.st <= 0) {
      const bot = stairPoint(st, 0);
      p.x = bot.x;
      p.y = bot.y;
      p.onStair = false;
      p.stair = null;
      p.grounded = true;
      p.vy = 0;
      p.vx = 0;
      return;
    }
    const pt = stairPoint(st, p.st);
    p.x = pt.x;
    p.y = pt.y;
    p.vy = 0;
    p.vx = 0;
    p.grounded = true;
    if (dir) p.face = st.dx > 0 ? (dir > 0 ? 1 : -1) : (dir > 0 ? -1 : 1);
  }

  function demoThink() {
    const p = G.player;
    demo.r = true;
    demo.l = false;
    demo.u = false;
    demo.fire = false;
    if (p.grounded && pitAhead(p.x, p.y, 1)) demo.u = true;
    if (((G.clock * 2) | 0) % 3 === 0 && G.whipT <= 0) demo.fire = true;
    tryMountStair(p);
    if (p.x > 720) {
      G.player = makePlayer(70, GY);
      G.camX = 0;
      G.whipLv = 2;
      let i;
      for (i = 0; i < G.candles.length; i++) G.candles[i].broken = false;
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

    if (G.knockT > 0) {
      G.knockT -= dt;
      p.onStair = false;
      p.duck = false;
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

    if (p.onStair) {
      p.duck = false;
      p.h = PH;
      moveOnStair(p, dt);
    } else {
      tryMountStair(p);
    }

    if (p.onStair) {
      p.h = PH;
      p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
    } else {
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
    }

    if (p.y > VH + 90) die('fall');
    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
    if (p.grounded && Math.abs(p.vx) > 20) p.run += dt * 10;
    else p.run += dt * 2;
    if (p.pose > 0) p.pose -= dt;

    if (p.grounded && !p.onStair && p.x > G.checkX + 80) {
      const ck = platUnder(p.x, p.y, null);
      if (ck && ck.base && p.x > ck.x + 36 && p.x < ck.x + ck.w - 36) {
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
      if (overlap(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.45, e.y - e.h, e.w * 0.9, e.h * 0.92)) {
        hurt(e.x, e.kind === 'knight' ? 2 : 1, 'hit');
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
    e.hitN = 0.08;
    const cx = e.x;
    const cy = e.y - e.h * 0.5;
    if (e.hp <= 0) {
      e.dead = true;
      bumpCombo();
      const sc = (SCORE[e.kind] || 100) * G.mult;
      addScore(sc);
      floatText(cx, cy, String(sc), GOLD, e.kind === 'knight');
      audio.hit(G.combo);
      juice(cx, cy, e.kind === 'medusa' ? GRN : HOT, e.kind === 'knight' ? 1.1 : 0.75);
      hitStop(e.kind === 'knight' ? 0.06 : 0.042);
    } else {
      audio.crack();
      emit(6, {
        x: cx, y: cy, j: 5,
        vx0: -120, vx1: 120, vy0: -180, vy1: -20,
        life: 0.2, r0: 1, r1: 2.4, rgb: src === 'whip' ? CYN : GOLD
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
      b.dead = true;
      b.active = false;
      bumpCombo();
      addScore(SCORE.boss * G.mult);
      addScore(SCORE.stage * G.stage);
      floatText(b.x, b.y - 30, String(SCORE.boss * G.mult), GOLD, true);
      audio.boom();
      juice(b.x, b.y - 18, GOLD, 1.6);
      toast(b.name + ' 倒下', false, true);
      G.lock = 0.2;
      G.clearT = 1.6;
    }
  }

  function onScreen(x, y, pad) {
    const m = pad || 40;
    return x > G.camX - m && x < G.camX + VW + m && y > G.camY - m && y < G.camY + VH + m;
  }

  function spawnMedusa() {
    let n = 0;
    let i;
    for (i = 0; i < G.ents.length; i++) {
      if (!G.ents[i].dead && G.ents[i].kind === 'medusa') n += 1;
    }
    const cap = isNight() ? 4 : 3;
    if (n >= cap) return;
    const fromL = Math.random() < 0.5;
    const x = fromL ? G.camX - 18 : G.camX + VW + 18;
    const y = 150 + rand(0, 140);
    const e = makeEnt(x, y, 'medusa', 0, 0);
    e.face = fromL ? 1 : -1;
    e.base = y;
    G.ents.push(e);
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    if (e.hitN > 0) e.hitN -= dt;
    e.t += dt;
    const mul = spdMul(isNight(), G.stage);
    if (e.kind === 'medusa') {
      e.x += e.face * 108 * mul * dt;
      e.y = e.base + Math.sin(e.t * 4.2) * 30;
      if (e.x < G.camX - 60 || e.x > G.camX + VW + 60) e.dead = true;
      return;
    }
    if (!onScreen(e.x, e.y, 80)) return;
    if (e.kind === 'bat') {
      e.x += (e.face || -1) * 52 * mul * dt;
      if (e.x < e.a) e.face = 1;
      if (e.x > e.b) e.face = -1;
      e.y = e.base + Math.sin(e.t * 3.1) * 16;
      return;
    }
    const walk = (e.kind === 'knight' ? 42 : 30) * mul;
    if (e.x < e.a) e.face = 1;
    if (e.x > e.b) e.face = -1;
    if (!standAt(e.x + e.face * 12, e.y) && standAt(e.x, e.y)) e.face *= -1;
    else e.x += e.face * walk * dt;
    if (e.kind === 'knight') {
      e.fire -= dt;
      if (e.fire <= 0 && playing() && G.deadT <= 0 && Math.abs(G.player.x - e.x) < 280) {
        e.fire = (isNight() ? 1.35 : 1.8) / mul;
        e.face = G.player.x < e.x ? -1 : 1;
        spawnShot({
          x: e.x + e.face * 8, y: e.y - 20,
          vx: e.face * 160, vy: -280,
          from: 'e', kind: 'axe', dmg: 1, pierce: 0,
          life: 1.5, rgb: STN, hit: [], grav: 720, spin: 0
        });
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
    const mul = spdMul(isNight(), G.stage);
    const low = b.hp / b.max < 0.42;
    if (b.kind === '石像') {
      b.y = GY;
      b.x += Math.sin(b.t * 0.7) * 28 * dt;
      b.x = clamp(b.x, G.levelW - 280, G.levelW - 70);
      b.face = p.x < b.x ? -1 : 1;
      b.fire -= dt;
      if (b.fire <= 0 && playing() && G.deadT <= 0) {
        b.fire = (low ? 0.7 : 1.05) / mul;
        spawnShot({
          x: b.x + b.face * 12, y: b.y - 28,
          vx: b.face * 160, vy: -220,
          from: 'e', kind: 'bone', dmg: 1, pierce: 0,
          life: 1.6, rgb: STN, hit: [], grav: 640
        });
        if (low) enemyShoot(b, p.x - b.x, (p.y - 16) - (b.y - 24), 210, 'e');
      }
    } else if (b.kind === '美杜莎') {
      b.x = G.levelW - 160 + Math.sin(b.t * 0.9) * 50;
      b.y = GY - 8 + Math.sin(b.t * 1.6) * 18;
      b.face = p.x < b.x ? -1 : 1;
      b.fire -= dt;
      if (b.fire <= 0 && playing() && G.deadT <= 0) {
        b.fire = (low ? 0.55 : 0.88) / mul;
        const n = low ? 3 : 2;
        let i;
        for (i = 0; i < n; i++) {
          spawnShot({
            x: b.x, y: b.y - 22,
            vx: b.face * (140 + i * 40),
            vy: -40 + i * 50,
            from: 'e', kind: 'snake', dmg: 1, pierce: 0,
            life: 1.5, rgb: GRN, hit: []
          });
        }
      }
    } else {
      if (b.state === 'wait' || !b.state) b.state = 'idle';
      b.fire -= dt;
      if (b.fire <= 0 && playing() && G.deadT <= 0) {
        if (b.state === 'idle') {
          b.state = 'tp';
          b.fire = 0.18;
          popSpark(b.x, b.y - 20, MAG, 22);
        } else if (b.state === 'tp') {
          b.x = G.levelW - 80 - rand(40, 260);
          b.y = GY - (Math.random() < 0.35 ? 40 : 0);
          b.face = p.x < b.x ? -1 : 1;
          b.state = 'cast';
          b.fire = 0.22;
          popSpark(b.x, b.y - 20, HOT, 22);
          audio.crack();
        } else {
          const n = low ? 5 : 3;
          let i;
          for (i = 0; i < n; i++) {
            const a = -0.6 + i * (1.2 / Math.max(1, n - 1));
            spawnShot({
              x: b.x + b.face * 10, y: b.y - 26,
              vx: Math.cos(a) * b.face * 220,
              vy: Math.sin(a) * 180 - 40,
              from: 'e', kind: 'fire', dmg: 1, pierce: 0,
              life: 1.5, rgb: ORG, hit: []
            });
          }
          b.state = 'idle';
          b.fire = (low ? 0.7 : 1.1) / mul;
        }
      }
    }
  }

  function shotHits(s, x, y, w, h) {
    const r = s.kind === 'pool' ? 16 : (s.kind === 'axe' ? 9 : 5);
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
        if (s.kind === 'flask' || s.kind === 'axe' || s.kind === 'bone') {
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
            if (s.kind === 'bone' || s.kind === 'axe') {
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
            hitBoss(s.dmg || 1);
            if (s.kind !== 'pool' && !s.pierce) s.life = 0;
          }
        }
      } else if (playing() && G.deadT <= 0 && G.invuln <= 0) {
        const pb = pBox();
        if (shotHits(s, p.x, p.y, p.w, p.h) || overlap(s.x - 4, s.y - 4, 8, 8, pb.x, pb.y, pb.w, pb.h)) {
          s.life = 0;
          hurt(s.x, s.dmg || 1, 'hit');
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
        a: rand(0.03, 0.09),
        vx: rand(-8, 8)
      });
    }
    for (i = mist.length - 1; i >= 0; i--) {
      o = mist[i];
      o.x += o.vx * dt;
      if (o.x < G.camX - 80 || o.x > G.camX + VW + 80) mist.splice(i, 1);
    }
    if (isNight()) {
      if (rain.length < 40) {
        rain.push({
          x: G.camX + rand(-20, VW + 20),
          y: G.camY + rand(-20, VH),
          l: rand(8, 16),
          v: rand(220, 340)
        });
      }
      for (i = rain.length - 1; i >= 0; i--) {
        o = rain[i];
        o.y += o.v * dt;
        o.x += 40 * dt;
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
    if (playing() && G.deadT <= 0 && (G.stage >= 2 || isNight())) {
      const bossOn = G.boss && G.boss.active && !G.boss.dead;
      if (!bossOn) {
        G.medT -= dt;
        const wait = (G.stage >= 2 ? 1.35 : 1.8) / spdMul(isNight(), G.stage);
        if (G.medT <= 0) {
          G.medT = wait + rand(0, 0.4);
          spawnMedusa();
        }
      }
    }
    for (i = 0; i < G.candles.length; i++) G.candles[i].t += dt;
    updateCam(dt);
    updateFx(dt);
  }

  function drawSky() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (spec.theme === 'throne') {
      g.addColorStop(0, '#12061c');
      g.addColorStop(0.55, '#1a0824');
      g.addColorStop(1, '#100814');
    } else if (spec.theme === 'tower') {
      g.addColorStop(0, '#0c0818');
      g.addColorStop(0.5, '#140c22');
      g.addColorStop(1, '#0e0a18');
    } else {
      g.addColorStop(0, '#10081c');
      g.addColorStop(0.5, '#160c22');
      g.addColorStop(1, '#0c0816');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const mx = sx(G.camX + VW * 0.78);
    const my = sy(G.camY + 42);
    ctx.fillStyle = rgba(GOLD, isNight() ? 0.28 : 0.5);
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
      ctx.fillStyle = i % 2 ? '#120818' : '#0c0614';
      ctx.fillRect(x, base - h, w, h + 40 * scale);
      ctx.fillStyle = rgba(HOT, 0.12);
      ctx.fillRect(x, base - h, w, 3 * scale);
      win = hash2(i + 3);
      ctx.fillStyle = win > 0.55 ? rgba(GOLD, 0.32) : rgba(CYN, 0.14);
      ctx.fillRect(x + 8 * scale, base - h + 16 * scale, 6 * scale, 8 * scale);
      ctx.fillRect(x + 20 * scale, base - h + 32 * scale, 6 * scale, 8 * scale);
      if (spec.theme === 'tower') {
        ctx.fillStyle = '#160a20';
        ctx.fillRect(x + w * 0.3, base - h - 16 * scale, w * 0.4, 16 * scale);
      }
    }
    for (i = 0; i < mist.length; i++) {
      const m = mist[i];
      ctx.fillStyle = rgba(HOT2, m.a);
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

  function drawStairs() {
    let i, st, k, t, p0, p1;
    ctx.lineCap = 'square';
    for (i = 0; i < G.stairs.length; i++) {
      st = G.stairs[i];
      ctx.strokeStyle = rgba(GOLD, 0.55);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(st.x0), sy(st.y0));
      ctx.lineTo(sx(st.x1), sy(st.y1));
      ctx.stroke();
      const steps = Math.max(4, (st.len / 10) | 0);
      for (k = 0; k <= steps; k++) {
        t = k / steps;
        p0 = stairPoint(st, t);
        ctx.fillStyle = rgba(HOT2, 0.7);
        ctx.fillRect(sx(p0.x) - 3 * scale, sy(p0.y) - 1.4 * scale, 7 * scale, 2.4 * scale);
      }
      p1 = stairPoint(st, 0);
      ctx.fillStyle = rgba(CYN, 0.35);
      ctx.fillRect(sx(p1.x) - 3 * scale, sy(p1.y) - 3 * scale, 6 * scale, 6 * scale);
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
    else if (u.kind === 'axe') { rgb = GOLD; mark = '斧'; }
    else if (u.kind === 'water') { rgb = HOT2; mark = '水'; }
    else if (u.kind === 'meat') { rgb = ORG; mark = '肉'; }
    else if (u.kind === 'heart5') { rgb = MAG; mark = '心'; }
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
    if (s.kind === 'axe') ctx.rotate(s.spin || 0);
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
    } else if (s.kind === 'axe') {
      ctx.fillStyle = rgba(s.rgb || GOLD, 0.95);
      ctx.fillRect(-3 * sc, -8 * sc, 6 * sc, 16 * sc);
      ctx.fillRect(-8 * sc, -8 * sc, 16 * sc, 5 * sc);
    } else if (s.kind === 'fire') {
      ctx.fillStyle = rgba(ORG, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, 5 * sc, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.beginPath();
      ctx.arc(-1 * sc, -1 * sc, 2 * sc, 0, TAU);
      ctx.fill();
    } else if (s.kind === 'snake') {
      ctx.strokeStyle = rgba(GRN, 0.95);
      ctx.lineWidth = 2.4 * sc;
      ctx.beginPath();
      ctx.moveTo(-6 * sc, 0);
      ctx.quadraticCurveTo(0, -4 * sc, 7 * sc, 0);
      ctx.stroke();
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
    ctx.strokeStyle = G.whipLv >= 3 ? rgba(GOLD, 0.95) : G.whipLv === 2 ? rgba(CYN, 0.92) : rgba(ORG, 0.9);
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
    ctx.fillStyle = rgba(HOT, 0.55);
    ctx.beginPath();
    ctx.moveTo(-2 * s, -bodyH * s);
    ctx.lineTo(-12 * s, (-bodyH + 4) * s);
    ctx.lineTo(-6 * s, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(STN, 0.95);
    ctx.lineWidth = 2.1 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3 * s, -6 * s);
    ctx.lineTo(-4 * s + (opt.grounded ? -leg : 2 * s), 0);
    ctx.moveTo(3 * s, -6 * s);
    ctx.lineTo(4 * s + (opt.grounded ? leg : -2 * s), 0);
    ctx.stroke();
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.fillRect(-6.2 * s, -bodyH * s - 5 * s, 12.4 * s, bodyH * s);
    ctx.fillStyle = rgba(GOLD, 0.45);
    ctx.fillRect(-6.2 * s, -bodyH * s - 5 * s, 12.4 * s, 2 * s);
    ctx.fillStyle = rgba(ORG, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -(bodyH + 11) * s, 5.2 * s, 5.4 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.fillRect(-5 * s, -(bodyH + 14) * s, 10 * s, 2.2 * s);
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
    if (e.hitN > 0 && ((G.t * 30) | 0) % 2 === 0) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(e.face, 1);
    if (e.kind === 'medusa') {
      ctx.fillStyle = rgba(GRN, 0.95);
      ctx.beginPath();
      ctx.arc(0, -6 * s, 6.2 * s, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(LEAF, 0.9);
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath();
      ctx.moveTo(-5 * s, -10 * s);
      ctx.quadraticCurveTo(-10 * s, -16 * s, -6 * s, -18 * s);
      ctx.moveTo(4 * s, -11 * s);
      ctx.quadraticCurveTo(10 * s, -16 * s, 7 * s, -19 * s);
      ctx.stroke();
      ctx.fillStyle = '#14081c';
      ctx.fillRect(-2.6 * s, -7 * s, 2 * s, 2 * s);
      ctx.fillRect(0.8 * s, -7 * s, 2 * s, 2 * s);
    } else if (e.kind === 'bat') {
      const flap = Math.sin(e.t * 12) * 6;
      ctx.fillStyle = rgba(HOT2, 0.9);
      ctx.beginPath();
      ctx.ellipse(0, -6 * s, 4 * s, 3.2 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.75);
      ctx.beginPath();
      ctx.moveTo(0, -6 * s);
      ctx.lineTo(-12 * s, (-8 - flap) * s);
      ctx.lineTo(-2 * s, -4 * s);
      ctx.moveTo(0, -6 * s);
      ctx.lineTo(12 * s, (-8 + flap) * s);
      ctx.lineTo(2 * s, -4 * s);
      ctx.fill();
    } else if (e.kind === 'knight') {
      ctx.fillStyle = rgba(STN, 0.95);
      ctx.fillRect(-7 * s, -22 * s, 14 * s, 18 * s);
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.fillRect(-7 * s, -22 * s, 14 * s, 3 * s);
      ctx.fillStyle = rgba(HOT, 0.5);
      ctx.fillRect(4 * s, -18 * s, 5 * s, 10 * s);
      ctx.fillStyle = rgba(STN, 0.95);
      ctx.beginPath();
      ctx.arc(0, -26 * s, 5 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.5);
      ctx.fillRect(-3 * s, -27 * s, 6 * s, 2 * s);
    } else {
      const wob = Math.sin(e.t * 4) * 2 * s;
      ctx.fillStyle = rgba(GRN, 0.55);
      ctx.fillRect(-6 * s + wob * 0.2, -16 * s, 12 * s, 16 * s);
      ctx.fillStyle = rgba(STN, 0.9);
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
    if (b.kind === '石像') {
      ctx.fillStyle = rgba(STN, 0.95);
      ctx.fillRect(-14 * s, -36 * s, 28 * s, 36 * s);
      ctx.fillStyle = rgba(HOT, 0.35);
      ctx.fillRect(-14 * s, -36 * s, 28 * s, 5 * s);
      ctx.beginPath();
      ctx.moveTo(-16 * s, -36 * s);
      ctx.lineTo(-6 * s, -50 * s);
      ctx.lineTo(6 * s, -50 * s);
      ctx.lineTo(16 * s, -36 * s);
      ctx.fillStyle = rgba(STN, 0.9);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.7);
      ctx.fillRect(-6 * s, -28 * s, 4 * s, 4 * s);
      ctx.fillRect(2 * s, -28 * s, 4 * s, 4 * s);
    } else if (b.kind === '美杜莎') {
      ctx.fillStyle = rgba(GRN, 0.9);
      ctx.fillRect(-12 * s, -32 * s, 24 * s, 32 * s);
      ctx.fillStyle = rgba(LEAF, 0.85);
      ctx.beginPath();
      ctx.arc(0, -40 * s, 10 * s, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(GRN, 0.9);
      ctx.lineWidth = 2 * s;
      let k;
      for (k = 0; k < 5; k++) {
        const ang = -1.2 + k * 0.6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * 8 * s, -40 * s + Math.sin(ang) * 4 * s);
        ctx.quadraticCurveTo(
          Math.cos(ang) * 20 * s,
          -56 * s + Math.sin(G.clock * 6 + k) * 6 * s,
          Math.cos(ang) * 16 * s,
          -62 * s
        );
        ctx.stroke();
      }
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
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.fillRect(-7 * s, -52 * s, 14 * s, 4 * s);
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
    if (isNight()) {
      ctx.strokeStyle = 'rgba(180,160,255,0.22)';
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
    ctx.fillStyle = '#080210';
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
    drawStairs();

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
        run: p.run, grounded: p.grounded && !p.onStair,
        squash: p.squash, duck: p.duck, blink: blink
      });
      drawWhip(p);
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
    const subk = k === 'z' || k === 'Z' || k === 'x' || k === 'X' || k === 'Shift'
      || code === 'ControlLeft' || code === 'ControlRight' || k === 'Control';

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
      startGame('enter');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('night');
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

  if (btnEnter) {
    btnEnter.addEventListener('click', function () {
      audio.ensure();
      startGame('enter');
    });
  }
  if (btnNight) {
    btnNight.addEventListener('click', function () {
      audio.ensure();
      startGame('night');
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
      if (G.mode === 'win') startGame('night');
      else goTitle();
    });
  }
  if (modeEnter) {
    modeEnter.addEventListener('click', function () {
      audio.ensure();
      startGame('enter');
    });
  }
  if (modeNight) {
    modeNight.addEventListener('click', function () {
      audio.ensure();
      startGame('night');
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
