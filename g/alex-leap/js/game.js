'use strict';

(function () {
  const VW = 640;
  const VH = 360;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 12000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.32;
  const GY = 320;
  const MY = 248;
  const HY = 176;
  const WALK = 210;
  const BIKE_SPD = 360;
  const AIR = 0.88;
  const JUMP_V = 500;
  const GRAV = 1450;
  const MAX_FALL = 560;
  const COYOTE = 0.09;
  const BUFFER = 0.12;
  const PW = 14;
  const PH = 26;
  const PUNCH_T = 0.18;
  const PUNCH_CD = 0.26;
  const PUNCH_R = 26;
  const BRACE_R = 52;
  const BIKE_T = 11.5;
  const HP_MAX = 2;
  const INVULN = 1.35;
  const DIE_T = 0.82;
  const BW = 22;
  const COST_LIFE = 10;
  const COST_BRACE = 8;
  const COST_BIKE = 12;
  const BEST_KEY = 'playbox-alex-leap-best';
  const MUTE_KEY = 'playbox-alex-leap-mute';
  const OPS = '方向键 / WASD 走跳 · Z 出拳 · 下掉落 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 176, 26];
  const HOT2 = [255, 213, 106];
  const WHT = [246, 243, 239];
  const LEAF = [61, 255, 122];
  const SKIN = [232, 176, 144];
  const FIST = [255, 74, 58];
  const SAND = [200, 136, 64];
  const PNK = [255, 138, 180];
  const LAVA = [255, 90, 40];
  const STONE = [168, 148, 128];

  const SCORE = {
    coin: 100, bag: 300, empty: 50, chick: 180, scorp: 260, frog: 280,
    bounce: 40, bossHit: 220, boss: 5200, stage: 2000, shop: 80
  };

  const ISLE = [
    {
      name: '奇村', boss: '石拳', w: 2360, hp: 8,
      ground: [[0, 520], [600, 460], [1160, 1200]],
      plats: [
        [170, MY, 170], [430, MY, 140], [760, MY, 190],
        [1080, MY, 160], [1460, MY, 190], [1860, MY, 170],
        [280, HY, 120], [880, HY, 130], [1580, HY, 140]
      ],
      blocks: [
        [200, MY, 'coin'], [226, MY, 'coin'], [252, MY, 'scorp'],
        [460, GY, 'coin'], [486, GY, 'bag'],
        [800, MY, 'coin'], [826, MY, 'empty'], [852, MY, 'coin'],
        [920, HY, 'brace'],
        [1240, GY, 'coin'], [1266, GY, 'scorp'],
        [1500, MY, 'bag'], [1526, MY, 'coin'],
        [1620, HY, 'life'],
        [1900, MY, 'coin'], [1926, MY, 'empty']
      ],
      shops: [
        [960, GY, 'life'], [1000, GY, 'brace'], [1040, GY, 'bike']
      ],
      bike: null,
      ents: [
        [340, GY, 'chick', 60, 500],
        [700, GY, 'chick', 620, 1020],
        [840, MY, 'frog', 760, 950],
        [1380, GY, 'chick', 1200, 1680],
        [1680, GY, 'scorp', 1220, 2100],
        [1940, MY, 'frog', 1860, 2030]
      ]
    },
    {
      name: '岩道', boss: '火拳', w: 2860, hp: 12,
      ground: [[0, 440], [520, 90], [720, 80], [920, 90], [1140, 110], [1380, 1480]],
      plats: [
        [80, MY, 140], [300, MY, 150], [560, MY, 120],
        [780, HY, 110], [980, MY, 130], [1220, MY, 140],
        [1560, MY, 180], [1920, MY, 190], [2280, MY, 180], [2580, MY, 150],
        [360, HY, 120], [1680, HY, 140], [2100, HY, 150], [2460, HY, 130]
      ],
      blocks: [
        [120, MY, 'coin'], [146, MY, 'bag'],
        [340, MY, 'coin'], [366, MY, 'scorp'],
        [600, MY, 'coin'], [800, HY, 'bag'],
        [1000, MY, 'empty'], [1240, MY, 'coin'],
        [1600, MY, 'coin'], [1626, MY, 'scorp'], [1652, MY, 'coin'],
        [1720, HY, 'brace'],
        [1980, MY, 'bag'], [2140, HY, 'life'],
        [2320, MY, 'coin'], [2500, HY, 'empty']
      ],
      shops: [
        [220, GY, 'life'], [260, GY, 'brace'], [300, GY, 'bike']
      ],
      bike: [400, GY],
      ents: [
        [200, GY, 'chick', 20, 420],
        [380, MY, 'frog', 300, 450],
        [640, MY, 'scorp', 560, 680],
        [1020, MY, 'frog', 980, 1110],
        [1480, GY, 'chick', 1400, 1800],
        [1760, GY, 'scorp', 1420, 2200],
        [1960, MY, 'frog', 1920, 2110],
        [2200, GY, 'chick', 1420, 2500],
        [2420, MY, 'scorp', 2280, 2460],
        [2620, GY, 'frog', 1420, 2700]
      ]
    },
    {
      name: '王殿', boss: '魔拳', w: 3180, hp: 16,
      ground: [[0, 400], [480, 360], [920, 380], [1400, 400], [1900, 1280]],
      plats: [
        [100, MY, 140], [320, MY, 150], [580, MY, 160],
        [860, MY, 170], [1180, MY, 180], [1520, MY, 170],
        [1860, MY, 190], [2280, MY, 200], [2680, MY, 180], [2940, MY, 140],
        [280, HY, 120], [700, HY, 140], [1240, HY, 150],
        [1720, HY, 160], [2320, HY, 170], [2760, HY, 140]
      ],
      blocks: [
        [140, MY, 'coin'], [166, MY, 'scorp'], [192, MY, 'coin'],
        [360, MY, 'bag'], [420, GY, 'coin'],
        [620, MY, 'empty'], [740, HY, 'brace'],
        [900, MY, 'coin'], [926, MY, 'scorp'],
        [1220, MY, 'bag'], [1280, HY, 'life'],
        [1560, MY, 'coin'], [1586, MY, 'scorp'],
        [1760, HY, 'coin'], [1960, GY, 'bag'],
        [2320, MY, 'coin'], [2346, MY, 'empty'],
        [2360, HY, 'scorp'], [2800, HY, 'bag'], [2980, MY, 'coin']
      ],
      shops: [
        [2000, GY, 'life'], [2040, GY, 'brace'], [2080, GY, 'bike']
      ],
      bike: [1080, GY],
      ents: [
        [260, GY, 'chick', 20, 380],
        [380, MY, 'frog', 320, 470],
        [540, GY, 'scorp', 500, 820],
        [640, MY, 'frog', 580, 740],
        [760, HY, 'scorp', 700, 840],
        [1060, GY, 'chick', 940, 1280],
        [1240, MY, 'frog', 1180, 1360],
        [1480, GY, 'scorp', 1440, 1780],
        [1640, MY, 'frog', 1520, 1690],
        [1880, GY, 'chick', 1920, 2400],
        [2140, GY, 'scorp', 1920, 2500],
        [2360, MY, 'frog', 2280, 2480],
        [2520, GY, 'chick', 1920, 2800],
        [2720, MY, 'scorp', 2680, 2860],
        [2960, GY, 'frog', 1920, 3060]
      ]
    }
  ];

  const RUSH = [
    {
      name: '石擂', boss: '石拳', w: 760, hp: 10,
      ground: [[0, 760]],
      plats: [[80, MY, 140], [320, MY, 160], [540, MY, 140], [200, HY, 120], [460, HY, 130]],
      blocks: [
        [120, MY, 'coin'], [146, MY, 'bag'], [360, MY, 'scorp'], [560, MY, 'coin']
      ],
      shops: [[70, GY, 'life'], [110, GY, 'brace'], [150, GY, 'bike']],
      bike: null,
      ents: [[280, GY, 'chick', 180, 420], [500, GY, 'scorp', 360, 620]]
    },
    {
      name: '火擂', boss: '火拳', w: 760, hp: 14,
      ground: [[0, 760]],
      plats: [[60, MY, 130], [300, MY, 170], [540, MY, 140], [180, HY, 120], [440, HY, 140]],
      blocks: [
        [90, MY, 'bag'], [330, MY, 'scorp'], [560, MY, 'coin'], [220, HY, 'brace']
      ],
      shops: [[70, GY, 'life'], [110, GY, 'brace'], [150, GY, 'bike']],
      bike: null,
      ents: [[260, GY, 'frog', 180, 420], [520, GY, 'scorp', 360, 640]]
    },
    {
      name: '魔擂', boss: '魔拳', w: 760, hp: 18,
      ground: [[0, 760]],
      plats: [[70, MY, 140], [280, MY, 180], [520, MY, 160], [160, HY, 130], [420, HY, 150]],
      blocks: [
        [100, MY, 'bag'], [310, MY, 'scorp'], [540, MY, 'life'], [200, HY, 'coin']
      ],
      shops: [[70, GY, 'life'], [110, GY, 'brace'], [150, GY, 'bike']],
      bike: null,
      ents: [[240, GY, 'scorp', 180, 400], [480, GY, 'frog', 360, 640], [600, MY, 'scorp', 520, 680]]
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
  function punchRange(brace) {
    return brace ? BRACE_R : PUNCH_R;
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
  function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }
  function shopCost(item) {
    if (item === 'life') return COST_LIFE;
    if (item === 'brace') return COST_BRACE;
    return COST_BIKE;
  }

  function selfCheck() {
    if (ISLE.length !== 3) throw new Error('3 islands');
    if (RUSH.length !== 3) throw new Error('3 rush');
    if (LIVES !== 3) throw new Error('3 lives');
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    const h = jumpHeight();
    if (h < 74 || h > 96) throw new Error('jump height ' + h);
    if (punchRange(true) <= punchRange(false)) throw new Error('brace farther');
    if (BIKE_SPD <= WALK) throw new Error('bike faster');
    if (ISLE[0].w >= ISLE[1].w || ISLE[1].w >= ISLE[2].w) throw new Error('wider later');
    if (ISLE[0].hp >= ISLE[1].hp || ISLE[1].hp >= ISLE[2].hp) throw new Error('boss hp');
    if (RUSH[0].hp <= ISLE[0].hp) throw new Error('rush harder');
    if (BEST_KEY !== 'playbox-alex-leap-best') throw new Error('best key');
    if (COST_LIFE < COST_BRACE) throw new Error('life costs more');
    let i, s, j, hasChick, hasScorp, hasQ, hasTrap, hasShop;
    for (i = 0; i < ISLE.length; i++) {
      s = ISLE[i];
      if (!s.ground.length || s.blocks.length < 8) throw new Error('stage goods');
      if (!s.shops || s.shops.length < 3) throw new Error('need shop');
      hasChick = false;
      hasScorp = false;
      hasQ = false;
      hasTrap = false;
      hasShop = false;
      for (j = 0; j < s.ents.length; j++) {
        if (s.ents[j][2] === 'chick') hasChick = true;
        if (s.ents[j][2] === 'scorp') hasScorp = true;
      }
      for (j = 0; j < s.blocks.length; j++) {
        if (s.blocks[j][2] === 'coin' || s.blocks[j][2] === 'bag') hasQ = true;
        if (s.blocks[j][2] === 'scorp') hasTrap = true;
      }
      for (j = 0; j < s.shops.length; j++) {
        if (s.shops[j][2] === 'bike') hasShop = true;
      }
      if (!hasChick || !hasScorp) throw new Error('need chicks scorp');
      if (!hasQ || !hasTrap) throw new Error('need loot traps');
      if (!hasShop) throw new Error('need bike shop');
    }
    if (!ISLE[1].bike) throw new Error('need bike pick');
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
  const btnIsle = document.getElementById('btn-isle');
  const btnRush = document.getElementById('btn-rush');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeIsle = document.getElementById('mode-isle');
  const modeRush = document.getElementById('mode-rush');
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
  const hpWrap = document.getElementById('hp-wrap');
  const hpBar = document.getElementById('hp-bar');
  const coinLabel = document.getElementById('coin-label');
  const gearLabel = document.getElementById('gear-label');
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

  const keys = { l: false, r: false, u: false, d: false };
  const demo = { l: false, r: true, u: false, punch: false };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];

  const G = {
    mode: 'title',
    kind: 'isle',
    t: 0,
    clock: 0,
    stage: 1,
    camX: 0,
    camY: 0,
    levelW: 2360,
    plats: [],
    blocks: [],
    shops: [],
    ents: [],
    shots: [],
    shocks: [],
    player: null,
    boss: null,
    bikePick: null,
    lives: LIVES,
    hp: HP_MAX,
    coins: 0,
    brace: false,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    punchCd: 0,
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
    sparkT: 0,
    arena: 0,
    checkX: 70,
    checkY: GY
  };

  function isRush() {
    return G.kind === 'rush';
  }
  function specs() {
    return isRush() ? RUSH : ISLE;
  }
  function playing() {
    return G.mode === 'play';
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
    punch() {
      this.ensure();
      this.noise(0.03, 0.032, 1400);
      this.beep(220, 0.05, 'square', 0.04, 110);
      this.beep(740, 0.06, 'sawtooth', 0.03, 280);
    },
    smash() {
      this.ensure();
      this.noise(0.07, 0.05, 700);
      this.beep(420, 0.08, 'square', 0.05, 180);
      this.beep(180, 0.1, 'triangle', 0.035, 70);
    },
    coin(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.05);
      this.beep(880 * lift, 0.07, 'square', 0.045, 1320 * lift);
      this.beep(1320 * lift, 0.1, 'sine', 0.03, 1760 * lift);
    },
    bounce() {
      this.ensure();
      this.beep(520, 0.06, 'square', 0.05, 880);
      this.beep(880, 0.1, 'triangle', 0.04, 1240);
      this.noise(0.04, 0.028, 1800);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.045, 0.04, 900);
      this.beep(480 * lift, 0.08, 'square', 0.05, 220);
      this.beep(720 * lift, 0.06, 'triangle', 0.03, 180);
    },
    breakHit() {
      this.ensure();
      this.beep(330, 0.08, 'sawtooth', 0.05, 880);
      this.beep(660, 0.12, 'square', 0.045, 1320);
      this.noise(0.08, 0.045, 600);
    },
    bike() {
      this.ensure();
      this.noise(0.1, 0.04, 1800);
      this.beep(240, 0.12, 'sawtooth', 0.04, 720);
      this.beep(880, 0.1, 'triangle', 0.03, 1400);
    },
    spark() {
      this.ensure();
      this.noise(0.03, 0.018, 2400);
    },
    shop() {
      this.ensure();
      this.beep(523, 0.07, 'square', 0.04, 784);
      this.beep(784, 0.1, 'triangle', 0.04, 1046);
    },
    noPay() {
      this.ensure();
      this.beep(180, 0.1, 'square', 0.035, 90);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    hurt() {
      this.ensure();
      this.noise(0.08, 0.045, 400);
      this.beep(240, 0.12, 'sawtooth', 0.045, 90);
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
    slam() {
      this.ensure();
      this.noise(0.1, 0.05, 280);
      this.beep(90, 0.14, 'sawtooth', 0.045, 50);
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
    const rush = isRush();
    if (modeIsle) modeIsle.setAttribute('aria-pressed', rush ? 'false' : 'true');
    if (modeRush) modeRush.setAttribute('aria-pressed', rush ? 'true' : 'false');
  }

  function gearText() {
    const p = G.player;
    const bits = [];
    if (G.brace) bits.push('力环');
    if (p && p.bike > 0) bits.push('摩托 ' + Math.ceil(p.bike));
    return bits.join(' · ');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = specs()[G.stage - 1] || specs()[0];
    if (stageLabel) {
      stageLabel.textContent = (isRush() ? '拳赛 ' : '') + spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isRush() ? '拳赛' : '奇岛';
      tagLabel.classList.toggle('warn', isRush());
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (hpBar) hpBar.style.transform = 'scaleX(' + clamp(G.hp / HP_MAX, 0, 1) + ')';
    if (hpWrap) {
      hpWrap.classList.toggle('warn', playing() && G.hp <= 1);
      hpWrap.classList.toggle('hot', G.player && G.player.bike > 0);
    }
    if (coinLabel) coinLabel.textContent = '币 ' + G.coins;
    if (gearLabel) {
      const g = gearText();
      gearLabel.classList.toggle('hidden', !g);
      gearLabel.classList.toggle('bike', !!(G.player && G.player.bike > 0));
      if (g) gearLabel.textContent = g;
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 挨打掉体，体空丢命，坠崖丢命', 'warn');
    else if (G.mode === 'win') setHint('仙境打通 · R 再来一局', 'hot');
    else if (G.lives === 1 && G.hp <= 1) setHint('最后一口气 · Z 出拳 · 踩头', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('拳赛 · 出拳破招 · 跳开头槌', 'hot');
    else setHint('走跳 · Z 出拳砸块 · 踩头 · 店里买装备', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'ALEX';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '拳赛' : '换模式';
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
    stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'win-flash');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'win-flash');
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
    if (!chainPop) return;
    chainPop.textContent = '×' + n;
    chainPop.classList.remove('hidden');
    chainTok += 1;
    const tok = chainTok;
    setTimeout(function () {
      if (tok === chainTok) chainPop.classList.add('hidden');
    }, 700);
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    const prev = G.mult;
    G.mult = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (G.mult > prev) {
      audio.combo(G.mult);
      showChain(G.mult);
    }
    syncHud();
  }

  function makePlat(x, y, w, h, base) {
    return { x: x, y: y, w: w, h: h || 18, base: !!base };
  }

  function makePlayer(x, y) {
    return {
      x: x, y: y, vx: 0, vy: 0, face: 1,
      grounded: true, coyote: COYOTE, run: 0,
      squash: 1, pose: 0, bike: 0, w: PW, h: PH, struck: 0, knock: 0
    };
  }

  function makeEnt(x, y, kind, a, b) {
    const frog = kind === 'frog';
    const scorp = kind === 'scorp';
    return {
      kind: kind, x: x, y: y,
      w: frog ? 20 : scorp ? 22 : 20,
      h: frog ? 18 : scorp ? 14 : 16,
      face: -1, a: a, b: b, vx: 0, vy: 0,
      grounded: true, t: rand(0, 1.4), hop: 0,
      hp: 1, dead: false, hurt: 0
    };
  }

  function makeBoss(spec) {
    const kind = spec.boss === '石拳' ? 'stone' : spec.boss === '火拳' ? 'fire' : 'dark';
    const hp = Math.round(spec.hp * (isRush() ? 1.12 : 1));
    return {
      kind: kind, name: spec.boss,
      x: spec.w - 160, y: GY,
      w: kind === 'dark' ? 46 : 42, h: kind === 'dark' ? 40 : 36,
      face: -1, vx: 0, vy: 0, grounded: true,
      hp: hp, max: hp, t: 0, atk: 0.8, phase: 0,
      active: false, dead: false, hurt: 0, glow: 0
    };
  }

  function makeBlock(x, y, loot) {
    return {
      x: x, y: y, w: BW, h: BW, loot: loot,
      smashed: false, pop: 0, q: loot !== 'empty'
    };
  }

  function makeShop(x, y, item) {
    return { x: x, y: y, w: 28, h: 30, item: item, sold: false, pop: 0 };
  }

  function landOn(x, y0, y1, skip) {
    let best = null;
    let i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (p === skip) continue;
      if (x < p.x - 4 || x > p.x + p.w + 4) continue;
      if (y0 <= p.y + 2 && y1 >= p.y - 1) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }

  function standAt(x, y) {
    let i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (x < p.x + 6 || x > p.x + p.w - 6) continue;
      if (Math.abs(y - p.y) < 10) return p;
    }
    return null;
  }

  function platUnder(x, y, skip) {
    let i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (p === skip) continue;
      if (x < p.x || x > p.x + p.w) continue;
      if (Math.abs(y - p.y) < 8) return p;
    }
    return null;
  }

  function pitAhead(x, face) {
    const d = face > 0 ? 42 : -42;
    return !standAt(x + d, GY) && !standAt(x + d * 1.6, GY);
  }

  function punchBox() {
    const p = G.player;
    const r = punchRange(G.brace);
    const x = p.face > 0 ? p.x + 6 : p.x - 6 - r;
    return { x: x, y: p.y - 22, w: r, h: 16 };
  }

  function loadStage(n, keepScore) {
    const list = specs();
    const spec = list[n - 1];
    G.stage = n;
    G.levelW = spec.w;
    G.arena = Math.max(0, spec.w - (isRush() ? 560 : 520));
    G.plats.length = 0;
    G.blocks.length = 0;
    G.shops.length = 0;
    G.ents.length = 0;
    G.shots.length = 0;
    G.shocks.length = 0;
    G.clearT = 0;
    G.lock = 0;
    G.punchCd = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;

    let i, g, e;
    for (i = 0; i < spec.ground.length; i++) {
      g = spec.ground[i];
      G.plats.push(makePlat(g[0], GY, g[1], VH - GY + 48, true));
    }
    for (i = 0; i < spec.plats.length; i++) {
      g = spec.plats[i];
      G.plats.push(makePlat(g[0], g[1], g[2], 14, false));
    }
    for (i = 0; i < spec.blocks.length; i++) {
      g = spec.blocks[i];
      G.blocks.push(makeBlock(g[0], g[1], g[2]));
    }
    for (i = 0; i < spec.shops.length; i++) {
      g = spec.shops[i];
      G.shops.push(makeShop(g[0], g[1], g[2]));
    }
    G.bikePick = spec.bike
      ? { x: spec.bike[0], y: spec.bike[1] - 10, taken: false }
      : null;
    for (i = 0; i < spec.ents.length; i++) {
      e = spec.ents[i];
      G.ents.push(makeEnt(e[0], e[1], e[2], e[3], e[4]));
    }
    if (isRush()) {
      for (i = 0; i < spec.ents.length; i += 2) {
        e = spec.ents[i];
        G.ents.push(makeEnt(e[0] + 40, e[1], e[2] === 'frog' ? 'scorp' : 'frog', e[3], e[4]));
      }
    }
    G.boss = makeBoss(spec);
    G.player = makePlayer(70, GY);
    G.camX = 0;
    G.camY = 0;
    G.hp = HP_MAX;
    G.invuln = keepScore ? 0.55 : 0;
    G.deadT = 0;
    G.checkX = 70;
    G.checkY = GY;
    if (!keepScore) {
      G.combo = 0;
      G.comboT = 0;
      G.mult = 1;
    }
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'isle';
    G.score = 0;
    G.lives = LIVES;
    G.nextLife = LIFE_EVERY;
    G.combo = 0;
    G.mult = 1;
    G.coins = 0;
    G.brace = false;
    G.hp = HP_MAX;
    G.why = '';
    loadStage(1, false);
    showOverlay('title', '仙境', '出拳砸块，踩头弹起。店里买命、力环、摩托。问号里有时藏蝎。尽头拳赛。');
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'rush' ? 'rush' : 'isle';
    G.mode = 'play';
    G.score = 0;
    G.lives = LIVES;
    G.nextLife = LIFE_EVERY;
    G.maxCombo = 0;
    G.coins = isRush() ? 10 : 0;
    G.brace = false;
    G.hp = HP_MAX;
    G.why = '';
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast(isRush() ? '拳赛 · 三场头目' : '奇岛 · ' + ISLE[0].name, false, !isRush());
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('isle');
    else startGame(G.kind);
  }

  function goLose() {
    G.mode = 'lose';
    saveBest();
    audio.lose();
    kick(8, 'die');
    const why = G.why === 'fall' ? '掉下去了' : '被揍到了';
    showOverlay('lose', why, '分数 ' + G.score + ' · 最高 ' + G.best + ' · 连击 ' + G.maxCombo);
    syncHud();
  }

  function goWin() {
    const bonus = 8000 * (isRush() ? 2 : 1);
    addScore(bonus);
    G.mode = 'win';
    saveBest();
    audio.win();
    kick(4, 'win-flash');
    screenFlash(GOLD, 0.45);
    showOverlay('win', isRush() ? '拳赛封王' : '仙境打通', '分数 ' + G.score + ' · 最高 ' + G.best + ' · 连击 ' + G.maxCombo);
    if (stageEl) stageEl.classList.add('win-flash');
    syncHud();
  }

  function nextStage() {
    const bonus = SCORE.stage * G.stage * G.mult;
    addScore(bonus);
    if (G.stage >= specs().length) {
      goWin();
      return;
    }
    G.stage += 1;
    const keepBrace = G.brace;
    const keepCoins = G.coins;
    loadStage(G.stage, true);
    G.brace = keepBrace;
    G.coins = keepCoins;
    audio.stage();
    toast(specs()[G.stage - 1].name, false, true);
    syncHud();
  }

  function respawn() {
    G.player = makePlayer(G.checkX, G.checkY);
    G.deadT = 0;
    G.invuln = INVULN;
    G.hp = HP_MAX;
    G.shots.length = 0;
    G.shocks.length = 0;
    syncHud();
  }

  function die(why) {
    if (!playing() || G.deadT > 0) return;
    G.why = why;
    G.deadT = DIE_T;
    G.lives -= 1;
    G.hp = 0;
    G.player.vy = -220;
    G.player.bike = 0;
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    juice(G.player.x, G.player.y - 12, MAG, 1.4);
    hitStop(0.07);
    kick(6.5, 'die');
    audio.death();
    syncHud();
  }

  function hurtPlayer() {
    if (!playing() || G.deadT > 0 || G.invuln > 0) return;
    const p = G.player;
    if (p.bike > 0) {
      p.bike = 0;
      G.invuln = 0.95;
      p.knock = -p.face * 220;
      p.vy = -180;
      juice(p.x, p.y - 8, CYN, 0.9);
      hitStop(0.045);
      kick(3.2, 'hit');
      audio.hurt();
      toast('摩托摔了', true, false);
      syncHud();
      return;
    }
    G.hp -= 1;
    G.invuln = INVULN;
    p.knock = -p.face * 240;
    p.vy = -160;
    juice(p.x, p.y - 12, MAG, 1.05);
    hitStop(0.06);
    kick(4.2, G.hp <= 0 ? 'die' : 'hit');
    if (G.hp <= 0) {
      die('hit');
      return;
    }
    audio.hurt();
    toast('挨打', true, false);
    syncHud();
  }

  function giveCoins(n, x, y) {
    G.coins += n;
    bumpCombo();
    const sc = (n > 1 ? SCORE.bag : SCORE.coin) * G.mult;
    addScore(sc);
    floatText(x, y - 12, '+' + n + '币', GOLD, n > 1);
    audio.coin(G.combo);
    syncHud();
  }

  function giveBrace(x, y) {
    G.brace = true;
    bumpCombo();
    addScore(400 * G.mult);
    floatText(x, y - 14, '力环', CYN, true);
    juice(x, y, CYN, 1.15);
    audio.shop();
    toast('力环 · 拳更远', false, true);
    syncHud();
  }

  function giveLife(x, y) {
    if (G.lives < LIFE_CAP) G.lives += 1;
    bumpCombo();
    addScore(800 * G.mult);
    floatText(x, y - 14, '1UP', LEAF, true);
    juice(x, y, LEAF, 1.2);
    audio.oneup();
    toast('额外一命', false, true);
    syncHud();
  }

  function mountBike(x, y, fromShop) {
    G.player.bike = BIKE_T;
    if (!fromShop) {
      bumpCombo();
      addScore(350 * G.mult);
    }
    juice(x, y, CYN, 1.1);
    hitStop(0.04);
    audio.bike();
    toast('摩托加速', false, true);
    floatText(x, y - 12, '摩托', CYN, true);
    syncHud();
  }

  function smashBlock(b) {
    if (b.smashed) return;
    b.smashed = true;
    b.pop = 0.22;
    const p = G.player;
    const cx = b.x;
    const cy = b.y - 11;
    juice(cx, cy, b.q ? GOLD : SAND, b.loot === 'scorp' ? 0.7 : 1.15);
    hitStop(0.055);
    kick(3.4, 'boom');
    audio.smash();
    addScore(SCORE.empty * G.mult);
    if (b.loot === 'coin') giveCoins(1, cx, cy);
    else if (b.loot === 'bag') giveCoins(5, cx, cy);
    else if (b.loot === 'brace') giveBrace(cx, cy);
    else if (b.loot === 'life') giveLife(cx, cy);
    else if (b.loot === 'scorp') {
      bumpCombo();
      const face = p ? p.face : 1;
      G.ents.push(makeEnt(cx + face * 18, b.y, 'scorp', cx - 90, cx + 90));
      floatText(cx, cy - 10, '蝎!', MAG, false);
      toast('蝎子蹦出来', true, false);
    } else {
      bumpCombo();
      floatText(cx, cy - 8, '+' + (SCORE.empty * G.mult), SAND, false);
    }
    G.checkX = b.x;
    G.checkY = b.y;
    syncHud();
  }

  function buyShop(s) {
    if (s.sold) return;
    const cost = shopCost(s.item);
    if (G.coins < cost) {
      audio.noPay();
      toast('钱不够 · ' + cost + ' 币', true, false);
      s.pop = 0.12;
      return;
    }
    G.coins -= cost;
    s.sold = true;
    s.pop = 0.2;
    addScore(SCORE.shop * G.mult);
    audio.shop();
    juice(s.x, s.y - 14, GOLD, 0.9);
    hitStop(0.04);
    if (s.item === 'life') giveLife(s.x, s.y);
    else if (s.item === 'brace') giveBrace(s.x, s.y);
    else mountBike(s.x, s.y, true);
    syncHud();
  }

  function hurtEnt(e, byBounce, parry) {
    if (e.dead || e.hurt > 0) return;
    const dmg = parry ? 2 : 1;
    e.hp -= dmg;
    e.hurt = 0.1;
    const p = G.player;
    if (e.hp <= 0) {
      e.dead = true;
      bumpCombo();
      const base = e.name
        ? SCORE.boss
        : (e.kind === 'frog' ? SCORE.frog : e.kind === 'scorp' ? SCORE.scorp : SCORE.chick);
      const extra = byBounce ? SCORE.bounce : 0;
      const sc = (base + extra) * G.mult;
      addScore(sc);
      floatText(e.x, e.y - 24, '+' + sc, e.name ? GOLD : HOT, !!e.name);
      juice(e.x, e.y - 10, e.name ? LAVA : (e.kind === 'frog' ? LEAF : e.kind === 'scorp' ? MAG : PNK), e.name ? 1.7 : 1.05);
      hitStop(e.name ? 0.075 : byBounce ? 0.062 : 0.05);
      if (byBounce) audio.bounce();
      else audio.hit(G.combo);
      if (e.name) {
        G.lock = 0.55;
        G.clearT = 1.15;
        toast(e.name + ' 倒下', false, true);
        screenFlash(GOLD, 0.4);
        kick(5, 'boom');
      }
    } else {
      e.x += (p && p.x < e.x ? 12 : -12);
      e.glow = 0.18;
      juice(e.x, e.y - 12, parry ? CYN : GOLD, parry ? 1.1 : 0.5);
      hitStop(parry ? 0.07 : 0.042);
      if (parry) {
        audio.breakHit();
        floatText(e.x, e.y - 28, '破招', CYN, true);
        toast('破招', false, true);
      } else {
        audio.hit(G.combo);
        floatText(e.x, e.y - 22, '-' + dmg, GOLD, false);
      }
    }
  }

  function doPunch() {
    if (G.deadT > 0 || G.lock > 0) return;
    if (G.mode !== 'play' && G.mode !== 'title') return;
    if (G.punchCd > 0) return;
    const p = G.player;
    if (!p) return;
    G.punchCd = PUNCH_CD * (G.brace ? 0.86 : 1);
    p.pose = PUNCH_T;
    p.struck = 0;
    audio.punch();
    const r = punchRange(G.brace);
    emit(5, {
      x: p.x + p.face * (10 + r * 0.4), y: p.y - 16, j: 5,
      vx0: p.face * 60, vx1: p.face * 220, vy0: -80, vy1: 40,
      life: 0.16, r0: 1, r1: 2.4, rgb: G.brace ? CYN : GOLD, g: 160
    });
  }

  function resolvePunch() {
    const p = G.player;
    if (!p || p.pose <= 0 || p.struck) return;
    const box = punchBox();
    let i, b, e, s;
    for (i = 0; i < G.blocks.length; i++) {
      b = G.blocks[i];
      if (b.smashed) continue;
      if (aabb(box.x, box.y, box.w, box.h, b.x - b.w / 2, b.y - b.h, b.w, b.h)) {
        smashBlock(b);
        p.struck = 1;
        return;
      }
    }
    for (i = 0; i < G.shops.length; i++) {
      s = G.shops[i];
      if (s.sold) continue;
      if (aabb(box.x, box.y, box.w, box.h, s.x - s.w / 2, s.y - s.h, s.w, s.h)) {
        buyShop(s);
        p.struck = 1;
        return;
      }
    }
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      if (aabb(box.x, box.y, box.w, box.h, e.x - e.w / 2, e.y - e.h, e.w, e.h)) {
        hurtEnt(e, false, false);
        p.struck = 1;
        return;
      }
    }
    const boss = G.boss;
    if (boss && boss.active && !boss.dead) {
      if (aabb(box.x, box.y, box.w, box.h, boss.x - boss.w / 2, boss.y - boss.h, boss.w, boss.h)) {
        const parry = boss.phase === 1 && boss.atk > 0;
        hurtEnt(boss, false, parry);
        if (parry) {
          boss.phase = 0;
          boss.atk = 0.55;
        }
        p.struck = 1;
      }
    }
  }

  function tryBounce(e) {
    const p = G.player;
    if (!p || G.deadT > 0) return false;
    if (p.vy < 70) return false;
    const head = e.y - e.h;
    if (p.y - 6 > head + 10) return false;
    if (Math.abs(p.x - e.x) > (e.w / 2 + 10)) return false;
    if (p.y < head - 8) return false;
    p.vy = -420;
    p.grounded = false;
    p.squash = 0.72;
    emit(10, {
      x: e.x, y: head, j: 8,
      vx0: -160, vx1: 160, vy0: -220, vy1: -20,
      life: 0.28, r0: 1.2, r1: 3.2, rgb: GOLD, g: 260
    });
    popSpark(e.x, head, WHT, 14);
    kick(2.8, 'thump');
    hurtEnt(e, true, false);
    return true;
  }

  function demoThink() {
    const p = G.player;
    demo.r = true;
    demo.l = false;
    demo.u = pitAhead(p.x, 1) && p.grounded;
    if (G.punchCd <= 0 && p.pose <= 0) {
      let i, b, e;
      for (i = 0; i < G.blocks.length; i++) {
        b = G.blocks[i];
        if (b.smashed) continue;
        if (b.x > p.x && b.x < p.x + 70 && Math.abs(b.y - p.y) < 36) {
          doPunch();
          break;
        }
      }
      if (p.pose <= 0) {
        for (i = 0; i < G.ents.length; i++) {
          e = G.ents[i];
          if (e.dead) continue;
          if (e.x > p.x && e.x < p.x + 60 && Math.abs(e.y - p.y) < 30) {
            doPunch();
            break;
          }
        }
      }
    }
    if (p.x > 980) {
      loadStage(1, false);
      G.brace = false;
      G.coins = 0;
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

    let ax = 0;
    if (inL()) ax -= 1;
    if (inR()) ax += 1;
    if (ax) p.face = ax;
    const bike = p.bike > 0;
    const spd = (bike ? BIKE_SPD : WALK) * (p.grounded ? 1 : AIR);
    p.vx = ax * spd;
    if (p.pose > 0) p.vx += p.face * (p.grounded ? 90 : 40);
    p.x += (p.vx + p.knock) * dt;
    p.knock = lerp(p.knock, 0, 1 - Math.pow(0.0008, dt));
    p.x = clamp(p.x, 16, G.levelW - 16);
    if (G.boss && G.boss.active && !G.boss.dead) {
      p.x = clamp(p.x, G.arena + 10, G.levelW - 24);
    }

    if (inU()) G.jumpBuf = BUFFER;
    else G.jumpBuf -= dt;
    if (G.jumpBuf < 0) G.jumpBuf = 0;

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
      p.squash = 0.76;
      audio.hop();
      emit(5, {
        x: p.x, y: p.y, j: 8,
        vx0: -70, vx1: 70, vy0: -20, vy1: 40,
        life: 0.2, r0: 1, r1: 2.2, rgb: bike ? CYN : WHT, g: 200
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
            vx0: -90, vx1: 90, vy0: -30, vy1: 10,
            life: 0.2, r0: 1, r1: 2.4, rgb: bike ? CYN : HOT2, g: 180
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
    if (ax && p.grounded) p.run += dt * (bike ? 14 : 9);
    else p.run += dt * 2;
    if (p.pose > 0) {
      p.pose -= dt;
      resolvePunch();
    }
    if (p.bike > 0) {
      p.bike -= dt;
      if (p.bike <= 0) {
        p.bike = 0;
        if (playing()) toast('摩托没了', true, false);
      }
      G.sparkT -= dt;
      if (p.grounded && Math.abs(p.vx) > 40 && G.sparkT <= 0) {
        G.sparkT = 0.045;
        emit(2, {
          x: p.x - p.face * 10, y: p.y, j: 4,
          vx0: -p.face * 80, vx1: -p.face * 20, vy0: -90, vy1: -10,
          life: 0.22, r0: 1, r1: 2.4, rgb: CYN, g: 80
        });
        if (Math.random() < 0.18) audio.spark();
      }
    }

    if (G.bikePick && !G.bikePick.taken && hypot(p.x - G.bikePick.x, p.y - 8 - G.bikePick.y) < 22) {
      G.bikePick.taken = true;
      mountBike(G.bikePick.x, G.bikePick.y, false);
    }

    let i, e;
    if (playing() || G.mode === 'title') {
      for (i = 0; i < G.ents.length; i++) {
        e = G.ents[i];
        if (e.dead) continue;
        if (aabb(p.x - PW / 2 + 3, p.y - PH + 4, PW - 6, PH - 6, e.x - e.w / 2, e.y - e.h, e.w, e.h)) {
          if (tryBounce(e)) continue;
          if (playing() && G.invuln <= 0) {
            hurtPlayer();
            return;
          }
        }
      }
      const b = G.boss;
      if (b && b.active && !b.dead) {
        if (aabb(p.x - PW / 2 + 3, p.y - PH + 4, PW - 6, PH - 6, b.x - b.w / 2, b.y - b.h, b.w, b.h)) {
          if (tryBounce(b)) { /* bounced */ }
          else if (playing() && G.invuln <= 0) {
            hurtPlayer();
            return;
          }
        }
        if (playing() && G.invuln <= 0 && b.phase === 2) {
          const fx = b.face > 0 ? b.x + 8 : b.x - 8 - 34;
          if (aabb(p.x - PW / 2 + 2, p.y - PH + 4, PW - 4, PH - 6, fx, b.y - 28, 34, 22)) {
            hurtPlayer();
            return;
          }
        }
      }
    }
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    const mul = isRush() ? 1.28 : (1 + Math.max(0, G.stage - 1) * 0.08);
    const p = G.player;
    e.t += dt;
    if (e.hurt > 0) e.hurt -= dt;

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

    if (e.kind === 'chick' || e.kind === 'scorp') {
      const spd = (e.kind === 'scorp' ? 72 : 48) * mul;
      const nx = e.x + e.face * spd * dt;
      if (nx < e.a || nx > e.b || !standAt(nx + e.face * 10, e.y)) e.face = -e.face;
      else e.x = nx;
    } else if (e.kind === 'frog') {
      if (e.grounded) {
        e.hop -= dt;
        if (e.hop <= 0) {
          if (Math.abs(p.x - e.x) < 260) e.face = p.x > e.x ? 1 : -1;
          e.vy = -420;
          e.vx = e.face * 140 * mul;
          e.grounded = false;
          e.hop = rand(0.7, 1.35) / mul;
        }
      } else {
        e.x += e.vx * dt;
        e.x = clamp(e.x, e.a, e.b);
      }
    }
  }

  function spawnShot(b) {
    G.shots.push({
      x: b.x + b.face * 18,
      y: b.y - 22,
      vx: b.face * 210,
      vy: -40,
      life: 1.5
    });
  }

  function spawnShock(b) {
    G.shocks.push({
      x: b.x, y: GY, vx: b.face * 200, life: 1.05, w: 28
    });
    audio.slam();
    kick(3.2, 'thump');
    emit(10, {
      x: b.x, y: GY, j: 14,
      vx0: -120, vx1: 120, vy0: -160, vy1: -20,
      life: 0.3, r0: 1.5, r1: 3.4, rgb: LAVA, g: 260
    });
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    const p = G.player;
    if (!b.active) {
      if (playing() && p.x > G.arena + 40) {
        b.active = true;
        toast('拳王 · ' + b.name, false, true);
        audio.boss();
        screenFlash(HOT, 0.3);
        kick(3.4, 'boom');
      }
      return;
    }
    b.t += dt;
    if (b.hurt > 0) b.hurt -= dt;
    if (b.glow > 0) b.glow -= dt;
    b.atk -= dt;
    const mul = isRush() ? 1.22 : 1;
    const low = b.hp / b.max < 0.45;

    if (!b.grounded) {
      b.vy += GRAV * dt;
      const y0 = b.y;
      const y1 = b.y + b.vy * dt;
      const plat = landOn(b.x, y0, y1, null);
      if (plat && b.vy >= 0) {
        b.y = plat.y;
        b.vy = 0;
        b.grounded = true;
        if (b.kind === 'dark') spawnShock(b);
      } else b.y = y1;
    }

    if (b.phase === 1) {
      b.face = p.x > b.x ? 1 : -1;
      if (b.atk <= 0) {
        b.phase = 2;
        b.atk = low ? 0.32 : 0.4;
        b.vx = b.face * (240 * mul);
        audio.punch();
      }
    } else if (b.phase === 2) {
      b.x += b.vx * dt;
      b.x = clamp(b.x, G.arena + 40, G.levelW - 40);
      if (b.atk <= 0) {
        b.phase = 0;
        b.atk = low ? 0.7 : 1.15;
        b.vx = 0;
        if (b.kind === 'fire') spawnShot(b);
      }
    } else {
      const spd = 58 * mul;
      b.face = p.x > b.x ? 1 : -1;
      const nx = b.x + b.face * spd * dt;
      if (nx > G.arena + 40 && nx < G.levelW - 40) b.x = nx;
      if (b.grounded && b.atk <= 0) {
        if (b.kind === 'dark' && Math.random() < 0.38) {
          b.vy = -460;
          b.vx = b.face * 80;
          b.grounded = false;
          b.atk = low ? 0.9 : 1.3;
        } else {
          b.phase = 1;
          b.atk = low ? 0.28 : 0.38;
          b.glow = b.atk;
        }
      }
    }
  }

  function updateHazards(dt) {
    const p = G.player;
    let i, o;
    for (i = G.shots.length - 1; i >= 0; i--) {
      o = G.shots[i];
      o.life -= dt;
      o.vy += 80 * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      if (o.life <= 0 || o.y > VH + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      if (playing() && G.deadT <= 0 && G.invuln <= 0 && hypot(p.x - o.x, p.y - 12 - o.y) < 16) {
        hurtPlayer();
        G.shots.splice(i, 1);
      }
    }
    for (i = G.shocks.length - 1; i >= 0; i--) {
      o = G.shocks[i];
      o.life -= dt;
      o.x += o.vx * dt;
      o.w = lerp(o.w, 46, 1 - Math.pow(0.02, dt));
      if (o.life <= 0) {
        G.shocks.splice(i, 1);
        continue;
      }
      if (playing() && G.deadT <= 0 && G.invuln <= 0 && p.grounded) {
        if (Math.abs(p.x - o.x) < o.w * 0.55 && Math.abs(p.y - o.y) < 10) hurtPlayer();
      }
    }
    for (i = 0; i < G.blocks.length; i++) {
      if (G.blocks[i].pop > 0) G.blocks[i].pop -= dt;
    }
    for (i = 0; i < G.shops.length; i++) {
      if (G.shops[i].pop > 0) G.shops[i].pop -= dt;
    }
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
    let tx = p.x - VW * 0.32;
    if (G.boss && G.boss.active && !G.boss.dead) tx = G.levelW - VW;
    tx = clamp(tx, 0, Math.max(0, G.levelW - VW));
    G.camX = lerp(G.camX, tx, 1 - Math.pow(0.0008, dt));
    let ty = 0;
    if (p.y < MY - 10) ty = p.y - MY;
    G.camY = lerp(G.camY, clamp(ty, -40, 20), 1 - Math.pow(0.002, dt));
  }

  function update(dt) {
    G.clock += dt;
    if (G.toastT > 0) G.toastT -= dt;
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0004, dt));

    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.35);
      return;
    }

    if (G.mode === 'title') demoThink();
    if (G.mode === 'win' || G.mode === 'lose') {
      updateFx(dt);
      return;
    }

    if (G.punchCd > 0) G.punchCd -= dt;
    if (G.invuln > 0) G.invuln -= dt;
    if (G.lock > 0) G.lock -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }

    updatePlayer(dt);
    let i;
    for (i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt);
    updateBoss(dt);
    updateHazards(dt);
    updateFx(dt);
    updateCam(dt);

    if (G.clearT > 0) {
      G.clearT -= dt;
      if (G.clearT <= 0 && G.lock <= 0) nextStage();
    }

    if (hpBar) hpBar.style.transform = 'scaleX(' + clamp(G.hp / HP_MAX, 0, 1) + ')';
    if ((G.clock * 8 | 0) !== ((G.clock - dt) * 8 | 0)) syncHud();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (isRush()) {
      g.addColorStop(0, '#1a0c18');
      g.addColorStop(0.5, '#241018');
      g.addColorStop(1, '#140806');
    } else if (G.stage === 1) {
      g.addColorStop(0, '#1a1428');
      g.addColorStop(0.45, '#3a2030');
      g.addColorStop(1, '#24140c');
    } else if (G.stage === 2) {
      g.addColorStop(0, '#18100a');
      g.addColorStop(0.5, '#2a1810');
      g.addColorStop(1, '#1a1008');
    } else {
      g.addColorStop(0, '#14081a');
      g.addColorStop(0.5, '#241018');
      g.addColorStop(1, '#18080c');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const sunX = sx(G.camX + VW * 0.78);
    const sunY = sy(46);
    ctx.fillStyle = rgba(GOLD, G.stage === 3 || isRush() ? 0.28 : 0.5);
    ctx.beginPath();
    ctx.arc(sunX, sunY, 28 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.85);
    ctx.beginPath();
    ctx.arc(sunX, sunY, 14 * scale, 0, TAU);
    ctx.fill();
  }

  function drawHills() {
    const s = scale;
    let k, x, h;
    ctx.fillStyle = G.stage === 3 || isRush()
      ? 'rgba(60, 16, 28, 0.5)'
      : G.stage === 2 ? 'rgba(48, 28, 12, 0.5)' : 'rgba(48, 22, 28, 0.5)';
    ctx.beginPath();
    ctx.moveTo(ox, oy + VH * s);
    for (k = 0; k <= 12; k++) {
      x = ox + (k / 12) * VW * s;
      h = 70 + hash2(k * 17 + G.stage * 9) * 50;
      ctx.lineTo(x, sy(GY - 40) - h * s * 0.25 + (G.camX * 0.08 % 40));
    }
    ctx.lineTo(ox + VW * s, oy + VH * s);
    ctx.fill();

    const start = ((G.camX * 0.35) / 90 | 0) - 1;
    for (k = start; k < start + 12; k++) {
      x = (k * 90) - (G.camX * 0.35 % 90);
      const px = ox + x * s;
      const base = sy(GY - 8);
      const tall = 40 + hash2(k * 3 + 2) * 32;
      ctx.fillStyle = rgba(SAND, 0.22);
      ctx.fillRect(px + 4 * s, base - tall * s, 6 * s, tall * s);
      ctx.fillStyle = rgba(LEAF, G.stage === 1 ? 0.45 : 0.22);
      ctx.beginPath();
      ctx.ellipse(px + 7 * s, base - tall * s, 14 * s, 8 * s, 0, 0, TAU);
      ctx.fill();
    }
  }

  function drawHut() {
    if (!G.shops.length) return;
    const s = scale;
    const left = G.shops[0].x - 36;
    const x = sx(left);
    const y = sy(GY);
    const w = 150 * s;
    ctx.fillStyle = 'rgba(20, 12, 6, 0.72)';
    ctx.fillRect(x, y - 52 * s, w, 52 * s);
    ctx.fillStyle = rgba(HOT, 0.85);
    ctx.beginPath();
    ctx.moveTo(x - 8 * s, y - 50 * s);
    ctx.lineTo(x + w / 2, y - 78 * s);
    ctx.lineTo(x + w + 8 * s, y - 50 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.font = 'bold ' + (11 * s) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('店', x + w / 2, y - 58 * s);
  }

  function drawPlats() {
    const s = scale;
    let i, p, x, y, w, h, k, n;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      x = sx(p.x);
      y = sy(p.y);
      w = p.w * s;
      h = p.h * s;
      ctx.fillStyle = p.base ? '#2a1608' : '#201408';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = rgba(p.base ? HOT : GOLD, p.base ? 0.85 : 0.55);
      ctx.fillRect(x, y, w, 2.4 * s);
      ctx.fillStyle = rgba(CYN, 0.18);
      ctx.fillRect(x + 2 * s, y + 2.4 * s, w - 4 * s, 1.1 * s);
      if (p.base) {
        n = Math.max(2, (p.w / 28) | 0);
        for (k = 0; k <= n; k++) {
          ctx.fillStyle = k % 2 ? rgba(HOT, 0.22) : rgba(SAND, 0.28);
          ctx.fillRect(x + (k / n) * w, y, 2 * s, 5 * s);
        }
      }
    }
  }

  function drawBlock(b) {
    const s = scale;
    const pop = b.pop > 0 ? 1 + b.pop * 2 : 1;
    const x = sx(b.x);
    const y = sy(b.y - 11);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pop, 2 - pop);
    if (b.smashed) {
      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = rgba(SAND, 0.5);
      ctx.lineWidth = 1.4 * s;
      ctx.strokeRect(-9 * s, -9 * s, 18 * s, 18 * s);
      ctx.restore();
      return;
    }
    ctx.fillStyle = b.q ? rgba(GOLD, 0.95) : rgba(SAND, 0.92);
    ctx.fillRect(-11 * s, -11 * s, 22 * s, 22 * s);
    ctx.strokeStyle = rgba(HOT, 0.9);
    ctx.lineWidth = 1.6 * s;
    ctx.strokeRect(-11 * s, -11 * s, 22 * s, 22 * s);
    if (b.q) {
      ctx.fillStyle = '#1a1006';
      ctx.font = 'bold ' + (16 * s) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 0, 1 * s);
      ctx.textBaseline = 'alphabetic';
    } else {
      ctx.strokeStyle = rgba(HOT, 0.45);
      ctx.beginPath();
      ctx.moveTo(-6 * s, -6 * s);
      ctx.lineTo(6 * s, 6 * s);
      ctx.moveTo(6 * s, -6 * s);
      ctx.lineTo(-6 * s, 6 * s);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShop(s) {
    const sc = scale;
    const pop = s.pop > 0 ? 1 + s.pop * 1.6 : 1;
    const x = sx(s.x);
    const y = sy(s.y - 16);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pop, 2 - pop);
    ctx.fillStyle = s.sold ? 'rgba(40,28,12,0.45)' : rgba(HOT, 0.92);
    ctx.fillRect(-12 * sc, -16 * sc, 24 * sc, 28 * sc);
    ctx.strokeStyle = rgba(GOLD, 0.9);
    ctx.lineWidth = 1.4 * sc;
    ctx.strokeRect(-12 * sc, -16 * sc, 24 * sc, 28 * sc);
    ctx.fillStyle = s.sold ? rgba(WHT, 0.35) : '#140c04';
    ctx.font = 'bold ' + (11 * sc) + 'px sans-serif';
    ctx.textAlign = 'center';
    const label = s.item === 'life' ? '命' : s.item === 'brace' ? '环' : '车';
    ctx.fillText(s.sold ? '售' : label, 0, -2 * sc);
    ctx.font = 'bold ' + (9 * sc) + 'px sans-serif';
    ctx.fillStyle = rgba(GOLD, 0.95);
    if (!s.sold) ctx.fillText(String(shopCost(s.item)), 0, 10 * sc);
    ctx.restore();
  }

  function drawBikePick() {
    const u = G.bikePick;
    if (!u || u.taken) return;
    const x = sx(u.x);
    const y = sy(u.y + Math.sin(G.clock * 5) * 3);
    const s = scale;
    ctx.fillStyle = rgba(CYN, 0.18);
    ctx.beginPath();
    ctx.arc(x, y, 12 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.beginPath();
    ctx.ellipse(x, y, 12 * s, 3.4 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.arc(x - 8 * s, y + 2 * s, 2.2 * s, 0, TAU);
    ctx.arc(x + 8 * s, y + 2 * s, 2.2 * s, 0, TAU);
    ctx.fill();
  }

  function drawChick(e) {
    const blink = e.hurt > 0 && ((G.t * 20) | 0) % 2 === 0;
    if (blink) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(e.face, 1);
    ctx.fillStyle = rgba(HOT2, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -8 * s, 8 * s, 7 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(FIST, 0.95);
    ctx.beginPath();
    ctx.moveTo(7 * s, -9 * s);
    ctx.lineTo(13 * s, -8 * s);
    ctx.lineTo(7 * s, -6 * s);
    ctx.fill();
    ctx.fillStyle = '#1a1008';
    ctx.beginPath();
    ctx.arc(3 * s, -10 * s, 1.3 * s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawScorp(e) {
    const blink = e.hurt > 0 && ((G.t * 20) | 0) % 2 === 0;
    if (blink) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(e.face, 1);
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -5 * s, 10 * s, 5 * s, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(FIST, 0.9);
    ctx.lineWidth = 2 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(6 * s, -8 * s);
    ctx.quadraticCurveTo(14 * s, -18 * s, 10 * s, -4 * s);
    ctx.stroke();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.fillRect(6 * s, -8 * s, 2 * s, 1.6 * s);
    ctx.restore();
  }

  function drawFrog(e) {
    const blink = e.hurt > 0 && ((G.t * 20) | 0) % 2 === 0;
    if (blink) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale;
    const squat = e.grounded ? 1 : 0.82;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(e.face, squat);
    ctx.fillStyle = rgba(LEAF, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -8 * s, 11 * s, 8 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.8);
    ctx.beginPath();
    ctx.ellipse(2 * s, -6 * s, 6 * s, 4 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.beginPath();
    ctx.arc(4 * s, -14 * s, 3.2 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#102018';
    ctx.beginPath();
    ctx.arc(5 * s, -14 * s, 1.4 * s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBossBody(b) {
    const blink = b.hurt > 0 && ((G.t * 20) | 0) % 2 === 0;
    if (blink) return;
    const x = sx(b.x);
    const y = sy(b.y);
    const s = scale * (b.kind === 'dark' ? 1.7 : 1.55);
    const wind = b.phase === 1;
    const punch = b.phase === 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(b.face, 1);
    const rgb = b.kind === 'fire' ? LAVA : b.kind === 'dark' ? MAG : STONE;
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -16 * s, 16 * s, 16 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(SKIN, 0.9);
    ctx.beginPath();
    ctx.arc(2 * s, -28 * s, 9 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a0808';
    ctx.beginPath();
    ctx.arc(5 * s, -29 * s, 1.8 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(wind || punch ? GOLD : FIST, punch ? 1 : 0.95);
    ctx.beginPath();
    ctx.arc(punch ? 22 * s : wind ? 16 * s : 12 * s, punch ? -18 * s : -20 * s, (wind ? 8 : 6) * s, 0, TAU);
    ctx.fill();
    if (wind) {
      ctx.strokeStyle = rgba(GOLD, 0.7 + Math.sin(G.clock * 18) * 0.25);
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.arc(16 * s, -20 * s, 12 * s, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBoy(p) {
    const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
    if (blink) return;
    const s = scale;
    const sq = p.squash || 1;
    const bike = p.bike > 0;
    const punching = p.pose > 0;
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.scale(p.face, sq);
    const leg = Math.sin(p.run) * (bike ? 2 : 5) * s;
    if (bike) {
      ctx.fillStyle = rgba(CYN, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, 1.5 * s, 14 * s, 3.4 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.beginPath();
      ctx.arc(-9 * s, 3 * s, 2.2 * s, 0, TAU);
      ctx.arc(9 * s, 3 * s, 2.2 * s, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.55 + Math.sin(G.clock * 24) * 0.25);
      ctx.lineWidth = 1.2 * s;
      ctx.beginPath();
      ctx.moveTo(-12 * s, 4 * s);
      ctx.lineTo(-18 * s, 1 * s);
      ctx.moveTo(-10 * s, 5 * s);
      ctx.lineTo(-16 * s, 8 * s);
      ctx.stroke();
    } else {
      ctx.strokeStyle = rgba(FIST, 0.95);
      ctx.lineWidth = 2.1 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-3 * s, -8 * s);
      ctx.lineTo(-4 * s + (p.grounded ? -leg : 2 * s), 0);
      ctx.moveTo(3 * s, -8 * s);
      ctx.lineTo(4 * s + (p.grounded ? leg : -2 * s), 0);
      ctx.stroke();
    }
    ctx.fillStyle = rgba(FIST, 0.95);
    ctx.beginPath();
    ctx.moveTo(-7 * s, -10 * s);
    ctx.lineTo(7 * s, -11 * s);
    ctx.lineTo(5 * s, -22 * s);
    ctx.lineTo(-5 * s, -21 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.fillRect(-6 * s, -13 * s, 12 * s, 2.2 * s);
    ctx.fillStyle = rgba(SKIN, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -28 * s, 7 * s, 7.2 * s, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(SKIN, 0.95);
    ctx.lineWidth = 1.8 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-5 * s, -33 * s);
    ctx.lineTo(-8 * s, -40 * s);
    ctx.moveTo(5 * s, -33 * s);
    ctx.lineTo(8 * s, -40 * s);
    ctx.stroke();
    ctx.fillStyle = '#1a1008';
    ctx.beginPath();
    ctx.arc(2.6 * s, -28 * s, 1.4 * s, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(SKIN, 0.9);
    ctx.lineWidth = 2 * s;
    const armX = punching ? 16 * s + (G.brace ? 8 * s : 0) : 6 * s;
    const armY = punching ? -18 * s : -14 * s;
    ctx.beginPath();
    ctx.moveTo(2 * s, -18 * s);
    ctx.lineTo(armX, armY);
    ctx.stroke();
    if (punching) {
      ctx.fillStyle = rgba(G.brace ? CYN : GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(armX + 3 * s, armY, (G.brace ? 5.2 : 3.6) * s, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(WHT, 0.7);
      ctx.lineWidth = 1.2 * s;
      ctx.beginPath();
      ctx.arc(armX + 3 * s, armY, (G.brace ? 8 : 6) * s, -0.6, 0.8);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShot(o) {
    const x = sx(o.x);
    const y = sy(o.y);
    const s = scale;
    ctx.fillStyle = rgba(LAVA, 0.9);
    ctx.beginPath();
    ctx.arc(x, y, 6 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.7);
    ctx.beginPath();
    ctx.arc(x - 1 * s, y - 1 * s, 2.4 * s, 0, TAU);
    ctx.fill();
  }

  function drawShock(o) {
    const x = sx(o.x);
    const y = sy(o.y);
    const s = scale;
    ctx.fillStyle = rgba(MAG, 0.55);
    ctx.beginPath();
    ctx.ellipse(x, y - 4 * s, o.w * 0.55 * s, 6 * s, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(HOT, 0.8);
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(x - o.w * 0.4 * s, y - 10 * s);
    ctx.lineTo(x, y - 22 * s);
    ctx.lineTo(x + o.w * 0.4 * s, y - 10 * s);
    ctx.stroke();
  }

  function drawBossBar() {
    const b = G.boss;
    if (!b || !b.active || b.dead) return;
    const x = ox + 80 * scale;
    const y = oy + 12 * scale;
    const w = (VW - 160) * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(FIST, 0.9);
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
    ctx.fillStyle = '#0c0903';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    const sh = REDUCE ? 0 : G.shake;
    if (sh > 0) {
      ctx.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh * 0.7);
    }
    if (G.punch !== 1 && !REDUCE) {
      ctx.translate(ox + VW * scale * 0.5, oy + VH * scale * 0.5);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-(ox + VW * scale * 0.5), -(oy + VH * scale * 0.5));
    }
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();

    drawSky();
    drawHills();
    drawPlats();
    drawHut();

    let i;
    for (i = 0; i < G.blocks.length; i++) drawBlock(G.blocks[i]);
    for (i = 0; i < G.shops.length; i++) drawShop(G.shops[i]);
    drawBikePick();
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      if (e.kind === 'frog') drawFrog(e);
      else if (e.kind === 'scorp') drawScorp(e);
      else drawChick(e);
    }
    if (G.boss && !G.boss.dead) drawBossBody(G.boss);
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);
    for (i = 0; i < G.shocks.length; i++) drawShock(G.shocks[i]);
    if (G.player) drawBoy(G.player);
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

  function primaryAction() {
    if (G.mode === 'title') startGame('isle');
    else if (G.mode === 'win' || G.mode === 'lose') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const punchKey = k === 'z' || k === 'Z';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;

    if (down && (isMove || space || punchKey || k === 'Enter' || k === 'r' || k === 'R' || k === 'm' || k === 'M')) {
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
    if (k === '1' && G.mode === 'title') {
      startGame('isle');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('rush');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (playing() || G.mode === 'title') doPunch();
      return;
    }
    if (punchKey) {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (playing() || G.mode === 'title') doPunch();
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
    hold(document.getElementById('btn-punch'), function () {
      if (overlayOpen()) { primaryAction(); return; }
      doPunch();
    }, null);
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen()) return;
      doPunch();
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
    G.t += dt;
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

  if (btnIsle) {
    btnIsle.addEventListener('click', function () {
      audio.ensure();
      startGame('isle');
    });
  }
  if (btnRush) {
    btnRush.addEventListener('click', function () {
      audio.ensure();
      startGame('rush');
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
      if (G.mode === 'win') startGame('rush');
      else goTitle();
    });
  }
  if (modeIsle) {
    modeIsle.addEventListener('click', function () {
      audio.ensure();
      startGame('isle');
    });
  }
  if (modeRush) {
    modeRush.addEventListener('click', function () {
      audio.ensure();
      startGame('rush');
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
    }
  });

  requestAnimationFrame(frame);
})();
