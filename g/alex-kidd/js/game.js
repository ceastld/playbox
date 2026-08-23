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
  const WALK = 224;
  const AIR = 0.88;
  const JUMP_V = 500;
  const GRAV = 1450;
  const MAX_FALL = 560;
  const COYOTE = 0.09;
  const BUFFER = 0.12;
  const PW = 14;
  const PH = 28;
  const PUNCH_T = 0.15;
  const PUNCH_CD = 0.22;
  const PUNCH_R = 32;
  const STAR_T = 8;
  const FIST_SPD = 520;
  const FIST_LIFE = 0.58;
  const INVULN = 1.4;
  const DIE_T = 0.82;
  const BW = 22;
  const BH = 22;
  const CLASH_ISLE = 1.4;
  const CLASH_CORE = 0.95;
  const STUN_T = 2.05;
  const HANDS = ['石', '剪', '布'];
  const BEST_KEY = 'playbox-alex-kidd-best';
  const MUTE_KEY = 'playbox-alex-kidd-mute';
  const OPS = '方向键 / WASD 走 · 上 / Z 跳 · 空格出拳 · 下掉落 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [232, 255, 106];
  const HOT = [196, 255, 26];
  const HOT2 = [216, 255, 112];
  const WHT = [244, 246, 239];
  const LEAF = [61, 255, 122];
  const SKIN = [255, 224, 184];
  const SAND = [200, 160, 64];
  const PNK = [255, 138, 180];
  const LAVA = [255, 90, 40];
  const STONE = [160, 176, 148];
  const SEA = [32, 160, 180];

  const SCORE = {
    empty: 60, bag: 280, rice: 800, star: 400,
    urchin: 160, bird: 200, fish: 220, ghost: 240,
    reflect: 80, clash: 600, bossHit: 180, boss: 5000, stage: 1800
  };

  const STAGES = [
    {
      name: '圣山', boss: '石灵', w: 2280, hp: 8,
      ground: [[0, 480], [560, 460], [1140, 1140]],
      plats: [
        [160, MY, 170], [400, MY, 150], [720, MY, 180],
        [1020, MY, 160], [1480, MY, 190], [1860, MY, 160],
        [280, HY, 120], [860, HY, 130], [1600, HY, 140]
      ],
      blocks: [
        [190, MY, 'bag'], [216, MY, 'empty'], [242, MY, 'star'],
        [440, GY, 'bag'], [466, GY, 'ghost'],
        [760, MY, 'empty'], [786, MY, 'bag'], [812, MY, 'rice'],
        [900, HY, 'star'],
        [1260, GY, 'bag'], [1286, GY, 'ghost'],
        [1520, MY, 'empty'], [1546, MY, 'bag'],
        [1640, HY, 'rice'],
        [1900, MY, 'bag'], [1926, MY, 'empty']
      ],
      ents: [
        [320, GY, 'urchin', 40, 460],
        [680, GY, 'urchin', 580, 1020],
        [800, MY, 'bird', 720, 900],
        [1380, GY, 'urchin', 1180, 1680],
        [1700, GY, 'urchin', 1180, 2080],
        [1940, MY, 'bird', 1860, 2040]
      ]
    },
    {
      name: '碧湖', boss: '剪灵', w: 2720, hp: 12,
      ground: [[0, 420], [500, 90], [700, 80], [900, 90], [1120, 110], [1360, 1360]],
      plats: [
        [80, MY, 140], [300, MY, 150], [540, MY, 130],
        [760, HY, 110], [980, MY, 140], [1220, MY, 150],
        [1540, MY, 180], [1900, MY, 190], [2260, MY, 170], [2500, MY, 150],
        [360, HY, 120], [1680, HY, 140], [2080, HY, 150], [2400, HY, 130]
      ],
      blocks: [
        [110, MY, 'bag'], [136, MY, 'star'],
        [330, MY, 'empty'], [356, MY, 'ghost'],
        [580, MY, 'bag'], [800, HY, 'rice'],
        [1020, MY, 'empty'], [1240, MY, 'bag'],
        [1580, MY, 'ghost'], [1606, MY, 'bag'], [1632, MY, 'star'],
        [1720, HY, 'bag'],
        [1960, MY, 'rice'], [2140, HY, 'empty'],
        [2300, MY, 'bag'], [2480, HY, 'star']
      ],
      ents: [
        [200, GY, 'urchin', 20, 400],
        [380, MY, 'bird', 300, 480],
        [620, GY, 'fish', 560, 680],
        [1040, MY, 'bird', 980, 1140],
        [1480, GY, 'urchin', 1400, 1800],
        [1760, GY, 'fish', 1700, 1840],
        [1980, MY, 'bird', 1900, 2140],
        [2200, GY, 'urchin', 1400, 2480],
        [2440, MY, 'ghost', 2260, 2500],
        [2560, GY, 'fish', 1400, 2620]
      ]
    },
    {
      name: '王岛', boss: '猜拳王', w: 3140, hp: 16,
      ground: [[0, 400], [480, 360], [920, 380], [1400, 400], [1920, 1220]],
      plats: [
        [100, MY, 140], [320, MY, 150], [580, MY, 160],
        [860, MY, 170], [1180, MY, 180], [1520, MY, 170],
        [1860, MY, 190], [2260, MY, 200], [2660, MY, 180], [2920, MY, 140],
        [280, HY, 120], [700, HY, 140], [1240, HY, 150],
        [1720, HY, 160], [2320, HY, 170], [2760, HY, 140]
      ],
      blocks: [
        [140, MY, 'bag'], [166, MY, 'ghost'], [192, MY, 'star'],
        [360, MY, 'bag'], [420, GY, 'empty'],
        [620, MY, 'ghost'], [740, HY, 'star'],
        [900, MY, 'bag'], [926, MY, 'rice'],
        [1220, MY, 'empty'], [1280, HY, 'bag'],
        [1560, MY, 'ghost'], [1586, MY, 'star'],
        [1760, HY, 'bag'], [1960, GY, 'rice'],
        [2320, MY, 'bag'], [2346, MY, 'ghost'],
        [2380, HY, 'star'], [2800, HY, 'bag'], [2980, MY, 'empty']
      ],
      ents: [
        [240, GY, 'urchin', 20, 380],
        [360, MY, 'ghost', 320, 470],
        [560, GY, 'urchin', 500, 820],
        [720, MY, 'bird', 580, 840],
        [780, HY, 'bird', 700, 860],
        [1080, GY, 'urchin', 940, 1320],
        [1240, MY, 'ghost', 1180, 1360],
        [1480, GY, 'urchin', 1440, 1860],
        [1680, MY, 'bird', 1520, 1760],
        [1840, GY, 'ghost', 1440, 1880],
        [2140, GY, 'urchin', 1960, 2760],
        [2360, MY, 'bird', 2260, 2480],
        [2520, GY, 'ghost', 1960, 2860],
        [2680, GY, 'urchin', 1960, 2880],
        [2860, MY, 'ghost', 2660, 2920],
        [3000, GY, 'bird', 1960, 3080]
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
  function spdMul(core, stage) {
    return (core ? 1.28 : 1) * (1 + Math.max(0, stage - 1) * 0.08);
  }
  function clashWin(a, b) {
    return (a + 1) % 3 === b;
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
  function killScore(kind) {
    if (kind === 'bird') return SCORE.bird;
    if (kind === 'fish') return SCORE.fish;
    if (kind === 'ghost') return SCORE.ghost;
    return SCORE.urchin;
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    const h = jumpHeight();
    if (h < 74 || h > 96) throw new Error('jump height ' + h);
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('core faster');
    if (CLASH_CORE >= CLASH_ISLE) throw new Error('core clash tighter');
    if (FIST_SPD * FIST_LIFE <= PUNCH_R) throw new Error('star fist reach');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    if (BEST_KEY !== 'playbox-alex-kidd-best') throw new Error('best key');
    if (!clashWin(0, 1) || !clashWin(1, 2) || !clashWin(2, 0)) throw new Error('rps');
    if (clashWin(0, 0) || clashWin(0, 2)) throw new Error('rps lose');
    let i, s, j, hasU, hasB, hasBlk;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ground.length || s.blocks.length < 8) throw new Error('stage goods');
      hasU = false;
      hasB = false;
      hasBlk = false;
      for (j = 0; j < s.ents.length; j++) {
        if (s.ents[j][2] === 'urchin') hasU = true;
        if (s.ents[j][2] === 'bird' || s.ents[j][2] === 'ghost') hasB = true;
      }
      for (j = 0; j < s.blocks.length; j++) {
        if (s.blocks[j][2] === 'bag' || s.blocks[j][2] === 'star') hasBlk = true;
      }
      if (!hasU || !hasB) throw new Error('need foes');
      if (!hasBlk) throw new Error('need punch blocks');
      if (s.shops) throw new Error('no shops');
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
  const btnIsle = document.getElementById('btn-isle');
  const btnCore = document.getElementById('btn-core');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeIsle = document.getElementById('mode-isle');
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
  const starWrap = document.getElementById('star-wrap');
  const starBar = document.getElementById('star-bar');
  const goldLabel = document.getElementById('gold-label');
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
  const demo = { l: false, r: true, u: false };
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
    levelW: 2280,
    plats: [],
    blocks: [],
    ents: [],
    fists: [],
    shots: [],
    waves: [],
    player: null,
    boss: null,
    clash: null,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    gold: 0,
    starT: 0,
    punchT: 0,
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
    arena: 0,
    checkX: 70,
    checkY: GY
  };

  function isCore() {
    return G.kind === 'core';
  }
  function playing() {
    return G.mode === 'play';
  }
  function inClash() {
    return !!(G.clash && G.clash.active);
  }
  function inL() {
    if (inClash()) return false;
    return G.mode === 'title' ? demo.l : keys.l;
  }
  function inR() {
    if (inClash()) return false;
    return G.mode === 'title' ? demo.r : keys.r;
  }
  function inU() {
    if (inClash()) return false;
    return G.mode === 'title' ? demo.u : keys.u;
  }
  function inD() {
    return G.mode === 'play' && keys.d && !inClash();
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
      this.noise(0.035, 0.034, 1600);
      this.beep(380, 0.06, 'sawtooth', 0.048, 140);
      this.beep(920, 0.045, 'square', 0.026, 420);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.05, 0.046, 720);
      this.beep(540 * lift, 0.09, 'square', 0.054, 180);
      this.beep(860 * lift, 0.07, 'triangle', 0.03, 150);
    },
    block() {
      this.ensure();
      this.noise(0.06, 0.05, 500);
      this.beep(240, 0.08, 'square', 0.05, 90);
      this.beep(720, 0.06, 'triangle', 0.03, 280);
    },
    bag(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.4, combo * 0.04);
      this.beep(880 * lift, 0.06, 'square', 0.042, 1320 * lift);
      this.beep(1320 * lift, 0.08, 'sine', 0.028, 1760 * lift);
    },
    star() {
      this.ensure();
      this.beep(520, 0.08, 'square', 0.045, 880);
      this.beep(880, 0.12, 'triangle', 0.04, 1400);
      this.beep(1175, 0.16, 'sine', 0.032, 1760);
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
    clash() {
      this.ensure();
      this.beep(196, 0.1, 'square', 0.05, 392);
      this.beep(294, 0.14, 'sawtooth', 0.04, 147);
    },
    winHand() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.05, 784);
      this.beep(784, 0.12, 'triangle', 0.045, 1175);
      this.noise(0.08, 0.04, 400);
    },
    loseHand() {
      this.ensure();
      this.beep(180, 0.12, 'sawtooth', 0.05, 70);
      this.beep(90, 0.2, 'sine', 0.04, 40);
    },
    drawHand() {
      this.ensure();
      this.beep(330, 0.08, 'square', 0.04, 220);
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
    reflect() {
      this.ensure();
      this.noise(0.04, 0.04, 1200);
      this.beep(640, 0.07, 'square', 0.045, 220);
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
    if (modeIsle) modeIsle.setAttribute('aria-pressed', core ? 'false' : 'true');
    if (modeCore) modeCore.setAttribute('aria-pressed', core ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      stageLabel.textContent = (isCore() ? '核 ' : '') + spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active) || inClash());
    }
    if (tagLabel) {
      tagLabel.textContent = isCore() ? '历核' : '阿历';
      tagLabel.classList.toggle('warn', isCore());
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    const star = clamp(G.starT / STAR_T, 0, 1);
    if (starBar) starBar.style.transform = 'scaleX(' + star + ')';
    if (starWrap) {
      starWrap.classList.toggle('hot', G.starT > 0);
      starWrap.classList.toggle('warn', inClash());
    }
    if (goldLabel) goldLabel.textContent = '金 ' + G.gold;
    if (gearLabel) {
      gearLabel.classList.toggle('hidden', G.starT <= 0);
      if (G.starT > 0) gearLabel.textContent = '星拳';
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞敌、坠崖都丢命', 'warn');
    else if (G.mode === 'win') setHint('圣山打通 · R 再来一局', 'hot');
    else if (inClash()) setHint('猜拳 · 左石 下剪 右布 · 空格剪', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 空格出拳砸砖', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('猜拳对打 · 出拳砸穿 · 剪弹可弹回', 'hot');
    else setHint('出拳砸砖 · 空格近拳 · 尽头猜拳 · 撞敌丢命', '');
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
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '历核' : '换模式';
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
      squash: 1, pose: 0, w: PW, h: PH
    };
  }

  function makeEnt(x, y, kind, a, b) {
    const bird = kind === 'bird';
    const fish = kind === 'fish';
    const ghost = kind === 'ghost';
    return {
      kind: kind, x: x, y: y, baseY: y,
      w: ghost ? 18 : bird ? 16 : fish ? 20 : 22,
      h: ghost ? 20 : bird ? 14 : fish ? 16 : 16,
      face: 1, vx: 0, vy: 0, grounded: !bird && !ghost,
      hp: 1, a: a, b: b,
      t: rand(0, TAU), hop: rand(0.4, 1.2),
      dead: false, hurt: 0, flying: bird || ghost
    };
  }

  function makeBoss(spec) {
    const core = isCore();
    const hp = Math.round(spec.hp * (core ? 1.28 : 1));
    return {
      name: spec.boss,
      x: spec.w - 180, y: GY,
      w: spec.boss === '猜拳王' ? 48 : 42,
      h: spec.boss === '猜拳王' ? 44 : 38,
      face: -1, vx: 0, vy: 0, grounded: true,
      hp: hp, max: hp, t: 0, atk: 0, phase: 0,
      stun: 0, charge: 0, hand: 0,
      active: false, dead: false, hurt: 0
    };
  }

  function makeBlock(x, y, kind) {
    return { x: x, y: y, kind: kind, smashed: false, pop: 0, squash: 1 };
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
    if (!p) return null;
    const r = PUNCH_R;
    if (p.face >= 0) return { x: p.x + 6, y: p.y - PH + 2, w: r, h: PH - 4 };
    return { x: p.x - 6 - r, y: p.y - PH + 2, w: r, h: PH - 4 };
  }

  function loadStage(n, keepScore) {
    const spec = STAGES[n - 1];
    G.stage = n;
    G.levelW = spec.w;
    G.arena = spec.w - 520;
    G.plats.length = 0;
    G.blocks.length = 0;
    G.ents.length = 0;
    G.fists.length = 0;
    G.shots.length = 0;
    G.waves.length = 0;
    G.clash = null;
    G.clearT = 0;
    G.lock = 0;
    G.punchCd = 0;
    G.punchT = 0;
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
    for (i = 0; i < spec.ents.length; i++) {
      e = spec.ents[i];
      G.ents.push(makeEnt(e[0], e[1], e[2], e[3], e[4]));
    }
    if (isCore()) {
      for (i = 0; i < spec.ents.length; i += 2) {
        e = spec.ents[i];
        const alt = e[2] === 'bird' ? 'urchin' : e[2] === 'urchin' ? 'ghost' : 'bird';
        G.ents.push(makeEnt(e[0] + 48, e[1], alt, e[3], e[4]));
      }
    }
    G.boss = makeBoss(spec);
    G.player = makePlayer(70, GY);
    G.camX = 0;
    G.camY = 0;
    G.invuln = keepScore ? 0.6 : 0;
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
    G.gold = 0;
    G.starT = 0;
    G.why = '';
    loadStage(1, false);
    showOverlay('title', '阿历', '出拳砸砖，尽头猜拳对打。空格出拳，上或 Z 跳。星砖里有金袋、饭团、星拳，也有灵。撞敌丢命。');
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'core' ? 'core' : 'isle';
    G.mode = 'play';
    G.score = 0;
    G.lives = LIVES;
    G.nextLife = LIFE_EVERY;
    G.maxCombo = 0;
    G.gold = 0;
    G.starT = isCore() ? STAR_T * 0.55 : 0;
    G.why = '';
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast(isCore() ? '历核 · 更密更快' : '阿历 · ' + STAGES[0].name, false, !isCore());
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('isle');
    else startGame(G.kind);
  }

  function goLose() {
    G.mode = 'lose';
    G.clash = null;
    saveBest();
    audio.lose();
    kick(8, 'die');
    const why = G.why === 'fall' ? '掉下去了' : G.why === 'janken' ? '猜拳输了' : '被揍到了';
    showOverlay('lose', why, '分数 ' + G.score + ' · 最高 ' + G.best + ' · 连击 ' + G.maxCombo);
    syncHud();
  }

  function goWin() {
    const bonus = 8000 * (isCore() ? 2 : 1);
    addScore(bonus);
    G.mode = 'win';
    G.clash = null;
    saveBest();
    audio.win();
    kick(4, 'win-flash');
    screenFlash(GOLD, 0.45);
    showOverlay('win', isCore() ? '历核打穿' : '圣山打通', '分数 ' + G.score + ' · 最高 ' + G.best + ' · 连击 ' + G.maxCombo);
    if (stageEl) stageEl.classList.add('win-flash');
    syncHud();
  }

  function nextStage() {
    const bonus = SCORE.stage * G.stage * G.mult;
    addScore(bonus);
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    const keepGold = G.gold;
    const keepStar = G.starT;
    G.stage += 1;
    loadStage(G.stage, true);
    G.gold = keepGold;
    G.starT = keepStar;
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    syncHud();
  }

  function respawn() {
    G.player = makePlayer(G.checkX, G.checkY);
    G.deadT = 0;
    G.invuln = INVULN;
    G.fists.length = 0;
    G.shots.length = 0;
    G.waves.length = 0;
    G.clash = null;
    G.punchT = 0;
    G.punchCd = 0;
    if (G.boss && G.boss.active && !G.boss.dead) {
      G.boss.stun = 0;
      G.boss.charge = 0;
      G.boss.atk = 0.8;
    }
    syncHud();
  }

  function die(why) {
    if (!playing() || G.deadT > 0) return;
    G.why = why;
    G.deadT = DIE_T;
    G.lives -= 1;
    G.player.vy = -220;
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    G.clash = null;
    juice(G.player.x, G.player.y - 12, MAG, 1.4);
    hitStop(0.07);
    kick(6.5, 'die');
    audio.death();
    syncHud();
  }

  function giveGold(n, x, y) {
    G.gold += n;
    const sc = SCORE.bag * G.mult;
    addScore(sc);
    floatText(x, y - 12, '+' + n + '金', GOLD, n > 1);
    audio.bag(G.combo);
    syncHud();
  }

  function giveLife(x, y) {
    if (G.lives < LIFE_CAP) G.lives += 1;
    addScore(SCORE.rice * G.mult);
    floatText(x, y - 14, '1UP', LEAF, true);
    juice(x, y, LEAF, 1.2);
    audio.oneup();
    toast('饭团续命', false, true);
    syncHud();
  }

  function giveStar(x, y) {
    G.starT = STAR_T;
    addScore(SCORE.star * G.mult);
    floatText(x, y - 14, '星拳', CYN, true);
    juice(x, y, CYN, 1.2);
    audio.star();
    toast('星拳 · 打出飞拳', false, true);
    syncHud();
  }

  function spawnGhost(x, y) {
    G.ents.push(makeEnt(x, y - 18, 'ghost', x - 80, x + 80));
    toast('砖里钻出灵', true, false);
  }

  function smashBlock(b) {
    if (b.smashed) return;
    b.smashed = true;
    b.pop = 0.22;
    bumpCombo();
    const cx = b.x;
    const cy = b.y - BH / 2;
    juice(cx, cy, b.kind === 'star' ? CYN : b.kind === 'rice' ? LEAF : GOLD, 1.15);
    hitStop(0.055);
    kick(3.4, 'boom');
    audio.block();
    if (b.kind === 'bag') giveGold(1, cx, cy);
    else if (b.kind === 'rice') giveLife(cx, cy);
    else if (b.kind === 'star') giveStar(cx, cy);
    else if (b.kind === 'ghost') {
      addScore(SCORE.empty * G.mult);
      spawnGhost(b.x, b.y);
    } else {
      addScore(SCORE.empty * G.mult);
      floatText(cx, cy - 10, '+' + (SCORE.empty * G.mult), HOT, false);
    }
    G.checkX = b.x;
    G.checkY = b.y;
    syncHud();
  }

  function hurtEnt(e, fromShot) {
    if (e.dead || e.hurt > 0) return;
    e.hp -= 1;
    e.hurt = 0.08;
    const p = G.player;
    if (e.hp <= 0) {
      e.dead = true;
      bumpCombo();
      const base = e.name ? SCORE.boss : killScore(e.kind);
      const sc = base * G.mult;
      addScore(sc);
      floatText(e.x, e.y - 24, '+' + sc, e.name ? GOLD : HOT, !!e.name);
      juice(e.x, e.y - 10, e.name ? MAG : (e.kind === 'ghost' ? PNK : e.kind === 'bird' ? CYN : STONE), e.name ? 1.7 : 1.15);
      hitStop(e.name ? 0.07 : fromShot ? 0.05 : 0.055);
      audio.hit(G.combo);
      if (e.name) {
        G.lock = 0.55;
        G.clearT = 1.15;
        G.clash = null;
        toast(e.name + ' 倒下', false, true);
        screenFlash(GOLD, 0.4);
        kick(5, 'boom');
      }
      syncHud();
    } else {
      e.x += (p && p.x < e.x ? 14 : -14);
      juice(e.x, e.y - 12, GOLD, 0.5);
      hitStop(0.04);
      audio.hit(G.combo);
      floatText(e.x, e.y - 22, '-' + e.hp, GOLD, false);
    }
  }

  function hurtBoss(n, fromClash) {
    const b = G.boss;
    if (!b || b.dead || !b.active) return;
    b.hp -= n;
    b.hurt = 0.1;
    bumpCombo();
    const sc = (fromClash ? SCORE.clash : SCORE.bossHit) * G.mult;
    addScore(sc);
    floatText(b.x, b.y - 28, '+' + sc, fromClash ? GOLD : HOT, fromClash);
    juice(b.x, b.y - 16, fromClash ? GOLD : MAG, fromClash ? 1.6 : 0.9);
    hitStop(fromClash ? 0.075 : 0.05);
    audio.hit(G.combo);
    if (b.hp <= 0) {
      b.hp = 0;
      b.dead = true;
      addScore(SCORE.boss * G.mult);
      juice(b.x, b.y - 16, GOLD, 1.8);
      hitStop(0.08);
      G.lock = 0.55;
      G.clearT = 1.2;
      G.clash = null;
      toast(b.name + ' 倒下', false, true);
      screenFlash(GOLD, 0.45);
      kick(5.4, 'boom');
    }
    syncHud();
  }

  function spawnFist(p) {
    G.fists.push({
      x: p.x + p.face * 18,
      y: p.y - 16,
      vx: p.face * FIST_SPD,
      vy: 0,
      life: FIST_LIFE,
      face: p.face
    });
  }

  function tryPunchHits() {
    const box = punchBox();
    if (!box) return;
    let i, e, b, s;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      if (aabb(box.x, box.y, box.w, box.h, e.x - e.w / 2, e.y - e.h, e.w, e.h)) {
        hurtEnt(e, false);
      }
    }
    for (i = 0; i < G.blocks.length; i++) {
      b = G.blocks[i];
      if (b.smashed) continue;
      if (aabb(box.x, box.y, box.w, box.h, b.x - BW / 2, b.y - BH, BW, BH)) smashBlock(b);
    }
    if (G.boss && G.boss.active && !G.boss.dead && !inClash()) {
      e = G.boss;
      if (aabb(box.x, box.y, box.w, box.h, e.x - e.w / 2, e.y - e.h, e.w, e.h)) {
        if (e.stun > 0 || e.charge <= 0) hurtBoss(1, false);
      }
    }
    for (i = G.shots.length - 1; i >= 0; i--) {
      s = G.shots[i];
      if (aabb(box.x, box.y, box.w, box.h, s.x - 8, s.y - 8, 16, 16)) {
        s.vx = -s.vx * 1.15;
        s.vy = -40;
        s.back = true;
        s.life = Math.max(s.life, 0.7);
        juice(s.x, s.y, CYN, 0.7);
        hitStop(0.045);
        audio.reflect();
        bumpCombo();
        addScore(SCORE.reflect * G.mult);
        popSpark(s.x, s.y, GOLD, 14);
      }
    }
  }

  function doPunch() {
    if (!playing() && G.mode !== 'title') return;
    if (G.deadT > 0 || G.lock > 0) return;
    if (inClash()) {
      pickHand(1);
      return;
    }
    if (G.punchCd > 0) return;
    const p = G.player;
    if (!p) return;
    G.punchCd = PUNCH_CD * (G.starT > 0 ? 0.82 : 1);
    G.punchT = PUNCH_T;
    p.pose = PUNCH_T;
    p.x += p.face * 6;
    audio.punch();
    emit(7, {
      x: p.x + p.face * 20, y: p.y - 14, j: 6,
      vx0: p.face * 90, vx1: p.face * 260, vy0: -140, vy1: 40,
      life: 0.2, r0: 1, r1: 2.8, rgb: G.starT > 0 ? GOLD : CYN, g: 160
    });
    popSpark(p.x + p.face * 24, p.y - 14, G.starT > 0 ? GOLD : HOT, 13);
    hitStop(0.032);
    kick(1.9, 'thump');
    tryPunchHits();
    if (G.starT > 0) spawnFist(p);
  }

  function startClash() {
    if (!G.boss || G.boss.dead || G.deadT > 0) return;
    const hand = (Math.random() * 3) | 0;
    G.clash = {
      active: true,
      hand: hand,
      t: isCore() ? CLASH_CORE : CLASH_ISLE,
      max: isCore() ? CLASH_CORE : CLASH_ISLE
    };
    G.boss.hand = hand;
    G.boss.charge = 0;
    audio.clash();
    screenFlash(HOT, 0.22);
    kick(2.6, 'hit');
    toast('猜拳！左石 下剪 右布', false, true);
    syncHud();
  }

  function pickHand(hand) {
    if (!inClash() || G.deadT > 0) return;
    const boss = G.clash.hand;
    G.clash.active = false;
    G.clash = null;
    const bx = G.boss ? G.boss.x : G.player.x;
    const by = G.boss ? G.boss.y - 24 : G.player.y;
    floatText(G.player.x, G.player.y - 36, HANDS[hand], CYN, true);
    floatText(bx, by - 10, HANDS[boss], MAG, true);
    if (hand === boss) {
      audio.drawHand();
      toast('平手 · 再猜', false, false);
      G.boss.atk = 0.35;
      hitStop(0.04);
    } else if (clashWin(hand, boss)) {
      audio.winHand();
      toast(HANDS[hand] + ' 克 ' + HANDS[boss], false, true);
      if (G.boss) {
        G.boss.stun = STUN_T;
        G.boss.charge = 0;
        G.boss.atk = STUN_T;
      }
      hurtBoss(2, true);
      juice(bx, by, GOLD, 1.5);
      screenFlash(GOLD, 0.35);
    } else {
      audio.loseHand();
      toast(HANDS[boss] + ' 克你', true, false);
      die('janken');
    }
    syncHud();
  }

  function demoThink() {
    const p = G.player;
    demo.r = true;
    demo.l = false;
    demo.u = pitAhead(p.x, 1) && p.grounded;
    if (G.punchCd <= 0) {
      let i, e, b;
      for (i = 0; i < G.ents.length; i++) {
        e = G.ents[i];
        if (e.dead) continue;
        if (e.x > p.x && e.x < p.x + 70 && Math.abs(e.y - p.y) < 40) {
          doPunch();
          break;
        }
      }
      for (i = 0; i < G.blocks.length; i++) {
        b = G.blocks[i];
        if (b.smashed) continue;
        if (b.x > p.x && b.x < p.x + 56 && Math.abs(b.y - p.y) < 36) {
          doPunch();
          break;
        }
      }
    }
    if (p.x > 920) {
      loadStage(1, false);
      G.starT = 0;
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
    const spd = WALK * (p.grounded ? 1 : AIR) * (isCore() && playing() ? 1.08 : 1);
    p.vx = ax * spd;
    p.x += p.vx * dt;
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
        life: 0.2, r0: 1, r1: 2.2, rgb: CYN, g: 200
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
            life: 0.2, r0: 1, r1: 2.4, rgb: CYN, g: 180
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
    if (ax && p.grounded) p.run += dt * 14;
    else p.run += dt * 3;
    if (p.pose > 0) p.pose -= dt;
    if (G.punchT > 0) G.punchT -= dt;

    if (playing() && G.invuln <= 0 && G.punchT <= 0 && !inClash()) {
      let i;
      for (i = 0; i < G.ents.length; i++) {
        const e = G.ents[i];
        if (e.dead) continue;
        if (aabb(p.x - PW / 2 + 3, p.y - PH + 4, PW - 6, PH - 6, e.x - e.w / 2, e.y - e.h, e.w, e.h)) {
          die('hit');
          return;
        }
      }
      const b = G.boss;
      if (b && b.active && !b.dead && b.stun <= 0) {
        if (aabb(p.x - PW / 2 + 3, p.y - PH + 4, PW - 6, PH - 6, b.x - b.w / 2, b.y - b.h, b.w, b.h)) {
          die('hit');
          return;
        }
      }
    }
  }

  function updateFists(dt) {
    let i, a, j, e, b, hit;
    for (i = G.fists.length - 1; i >= 0; i--) {
      a = G.fists[i];
      a.life -= dt;
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      if (a.life <= 0 || a.x < G.camX - 40 || a.x > G.camX + VW + 40) {
        G.fists.splice(i, 1);
        continue;
      }
      hit = false;
      for (j = 0; j < G.ents.length; j++) {
        e = G.ents[j];
        if (e.dead) continue;
        if (aabb(a.x - 10, a.y - 10, 20, 20, e.x - e.w / 2, e.y - e.h, e.w, e.h)) {
          hurtEnt(e, true);
          hit = true;
          break;
        }
      }
      if (!hit) {
        for (j = 0; j < G.blocks.length; j++) {
          b = G.blocks[j];
          if (b.smashed) continue;
          if (aabb(a.x - 10, a.y - 10, 20, 20, b.x - BW / 2, b.y - BH, BW, BH)) {
            smashBlock(b);
            hit = true;
            break;
          }
        }
      }
      if (!hit && G.boss && G.boss.active && !G.boss.dead && !inClash()) {
        e = G.boss;
        if (aabb(a.x - 10, a.y - 10, 20, 20, e.x - e.w / 2, e.y - e.h, e.w, e.h)) {
          hurtBoss(1, false);
          hit = true;
        }
      }
      if (hit) {
        emit(10, {
          x: a.x, y: a.y, j: 8,
          vx0: -180, vx1: 180, vy0: -220, vy1: 40,
          life: 0.24, r0: 1.2, r1: 3.2, rgb: GOLD, g: 240
        });
        popSpark(a.x, a.y, CYN, 16);
        G.fists.splice(i, 1);
      }
    }
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    const mul = spdMul(isCore(), G.stage);
    const p = G.player;
    e.t += dt;
    if (e.hurt > 0) e.hurt -= dt;

    if (e.kind === 'bird') {
      e.x += e.face * 78 * mul * dt;
      if (e.x < e.a || e.x > e.b) e.face = -e.face;
      e.y = e.baseY - 36 - Math.sin(e.t * 3.4) * 18;
      return;
    }
    if (e.kind === 'ghost') {
      if (p) {
        const dx = p.x - e.x;
        const dy = (p.y - 16) - e.y;
        const d = Math.max(12, hypot(dx, dy));
        e.x += (dx / d) * 92 * mul * dt;
        e.y += (dy / d) * 70 * mul * dt;
        e.face = dx >= 0 ? 1 : -1;
      }
      return;
    }

    if (!e.grounded) {
      e.vy += GRAV * dt;
      const y0 = e.y;
      const y1 = e.y + e.vy * dt;
      const plat = landOn(e.x, y0, y1, null);
      if (plat && e.vy >= 0 && e.kind !== 'fish') {
        e.y = plat.y;
        e.vy = 0;
        e.grounded = true;
      } else e.y = y1;
      if (e.kind === 'fish' && e.y > GY + 8) {
        e.y = GY + 8;
        e.vy = 0;
        e.grounded = true;
        e.hop = rand(0.9, 1.7) / mul;
      }
    }

    if (e.kind === 'urchin') {
      const spd = 46 * mul;
      const nx = e.x + e.face * spd * dt;
      if (nx < e.a || nx > e.b || !standAt(nx + e.face * 10, e.y)) e.face = -e.face;
      else e.x = nx;
    } else if (e.kind === 'fish') {
      if (e.grounded) {
        e.hop -= dt;
        if (e.hop <= 0) {
          e.vy = -640;
          e.vx = e.face * 40;
          e.grounded = false;
          e.hop = rand(1.1, 1.8) / mul;
        }
      } else {
        e.x += e.vx * dt;
      }
    }
  }

  function spawnShot(b, kind) {
    G.shots.push({
      x: b.x + b.face * 18,
      y: b.y - 22,
      vx: b.face * (kind === 'paper' ? 200 : 230),
      vy: kind === 'paper' ? 20 : -40,
      life: 1.5,
      kind: kind,
      back: false,
      face: b.face
    });
  }

  function spawnWave(b) {
    G.waves.push({
      x: b.x, y: GY, vx: b.face * 210, life: 1.05, w: 30
    });
    emit(8, {
      x: b.x, y: GY, j: 12,
      vx0: -100, vx1: 100, vy0: -140, vy1: -10,
      life: 0.26, r0: 1.4, r1: 3.2, rgb: PNK, g: 240
    });
    kick(2.4, 'thump');
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    const p = G.player;
    if (!b.active) {
      if (playing() && p.x > G.arena + 40) {
        b.active = true;
        toast('猜拳对打 · ' + b.name, false, true);
        audio.boss();
        screenFlash(MAG, 0.28);
        kick(3.4, 'boom');
        b.atk = 1.1;
      }
      return;
    }
    b.t += dt;
    if (b.hurt > 0) b.hurt -= dt;
    if (b.stun > 0) {
      b.stun -= dt;
      b.vx = 0;
      return;
    }
    if (inClash()) return;
    b.atk -= dt;
    if (b.charge > 0) b.charge -= dt;
    const mul = spdMul(isCore(), G.stage);
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
        if (b.name === '猜拳王') spawnWave(b);
      } else b.y = y1;
    }

    b.face = p.x > b.x ? 1 : -1;

    if (b.atk <= 0) {
      b.phase += 1;
      const clashEvery = low ? 3 : 4;
      if (b.phase % clashEvery === 0) {
        startClash();
        b.atk = 0.2;
        return;
      }
      if (b.name === '猜拳王' && b.phase % 3 === 0 && b.grounded) {
        b.vy = -460;
        b.vx = b.face * 120 * mul;
        b.grounded = false;
        b.atk = (low ? 1.0 : 1.35) / mul;
      } else if (b.name === '石灵' || (b.name === '猜拳王' && b.phase % 2 === 1)) {
        b.charge = low ? 0.55 : 0.7;
        b.atk = (low ? 1.05 : 1.4) / mul;
      } else if (b.name === '剪灵' || b.name === '猜拳王') {
        spawnShot(b, 'cut');
        if (low) spawnShot({ x: b.x, y: b.y - 8, face: b.face }, 'cut');
        b.atk = (low ? 0.95 : 1.25) / mul;
      } else {
        b.charge = 0.6;
        b.atk = 1.2 / mul;
      }
    }

    if (b.charge > 0) {
      const nx = b.x + b.face * 240 * mul * dt;
      if (nx < G.arena + 40 || nx > G.levelW - 40) b.face = -b.face;
      else b.x = nx;
    } else if (b.grounded) {
      const nx = b.x + b.face * 54 * mul * dt;
      if (nx < G.arena + 40 || nx > G.levelW - 40) b.face = -b.face;
      else b.x = nx;
    } else {
      b.x += b.vx * dt;
      b.x = clamp(b.x, G.arena + 40, G.levelW - 40);
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
      if (o.life <= 0 || o.y > VH + 30) {
        G.shots.splice(i, 1);
        continue;
      }
      if (o.back && G.boss && G.boss.active && !G.boss.dead) {
        if (aabb(o.x - 8, o.y - 8, 16, 16, G.boss.x - G.boss.w / 2, G.boss.y - G.boss.h, G.boss.w, G.boss.h)) {
          hurtBoss(1, false);
          juice(o.x, o.y, GOLD, 0.8);
          G.shots.splice(i, 1);
          continue;
        }
      }
      if (playing() && G.deadT <= 0 && G.invuln <= 0 && G.punchT <= 0 && !o.back) {
        if (hypot(p.x - o.x, p.y - 12 - o.y) < 16) {
          die('hit');
          G.shots.splice(i, 1);
        }
      }
    }
    for (i = G.waves.length - 1; i >= 0; i--) {
      o = G.waves[i];
      o.life -= dt;
      o.x += o.vx * dt;
      o.w = lerp(o.w, 48, 1 - Math.pow(0.02, dt));
      if (o.life <= 0) {
        G.waves.splice(i, 1);
        continue;
      }
      if (playing() && G.deadT <= 0 && G.invuln <= 0 && p.grounded) {
        if (Math.abs(p.x - o.x) < o.w * 0.55 && Math.abs(p.y - o.y) < 10) die('hit');
      }
    }
    for (i = 0; i < G.blocks.length; i++) {
      if (G.blocks[i].pop > 0) G.blocks[i].pop -= dt;
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
    if (G.starT > 0) G.starT = Math.max(0, G.starT - dt);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }

    if (inClash()) {
      G.clash.t -= dt;
      if (G.clash.t <= 0) {
        audio.loseHand();
        toast('猜拳超时', true, false);
        G.clash = null;
        die('janken');
      }
    }

    updatePlayer(dt);
    updateFists(dt);
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

    if (starBar) starBar.style.transform = 'scaleX(' + clamp(G.starT / STAR_T, 0, 1) + ')';
    if ((G.clock * 8 | 0) !== ((G.clock - dt) * 8 | 0)) syncHud();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (G.stage === 1) {
      g.addColorStop(0, '#102418');
      g.addColorStop(0.55, '#0c1c12');
      g.addColorStop(1, '#08140e');
    } else if (G.stage === 2) {
      g.addColorStop(0, '#082028');
      g.addColorStop(0.5, '#0a2420');
      g.addColorStop(1, '#07161a');
    } else {
      g.addColorStop(0, '#180818');
      g.addColorStop(0.5, '#140c18');
      g.addColorStop(1, '#0c0810');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const sunX = sx(G.camX + VW * 0.78);
    const sunY = sy(46);
    ctx.fillStyle = rgba(G.stage === 3 ? MAG : GOLD, G.stage === 3 ? 0.32 : 0.5);
    ctx.beginPath();
    ctx.arc(sunX, sunY, 28 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(G.stage === 3 ? PNK : HOT, 0.9);
    ctx.beginPath();
    ctx.arc(sunX, sunY, 14 * scale, 0, TAU);
    ctx.fill();
  }

  function drawHills() {
    const s = scale;
    let k, x, h;
    ctx.fillStyle = G.stage === 3 ? 'rgba(48, 16, 40, 0.55)' : G.stage === 2 ? 'rgba(8, 40, 48, 0.55)' : 'rgba(16, 48, 28, 0.52)';
    ctx.beginPath();
    ctx.moveTo(ox, oy + VH * s);
    for (k = 0; k <= 12; k++) {
      x = ox + (k / 12) * VW * s;
      h = 70 + hash2(k * 17 + G.stage * 9) * 50;
      ctx.lineTo(x, sy(GY - 40) - h * s * 0.25 + (G.camX * 0.08 % 40));
    }
    ctx.lineTo(ox + VW * s, oy + VH * s);
    ctx.fill();

    if (G.stage === 2) {
      ctx.fillStyle = rgba(SEA, 0.35 + Math.sin(G.clock * 2) * 0.06);
      ctx.fillRect(ox, sy(GY + 8), VW * s, 80 * s);
      ctx.strokeStyle = rgba(CYN, 0.35);
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath();
      for (k = 0; k < 8; k++) {
        const wx = ox + ((k * 90 - G.camX * 0.4) % (VW + 40)) * s;
        ctx.moveTo(wx, sy(GY + 12));
        ctx.quadraticCurveTo(wx + 20 * s, sy(GY + 6 + Math.sin(G.clock * 3 + k) * 4), wx + 40 * s, sy(GY + 12));
      }
      ctx.stroke();
    }

    const start = ((G.camX * 0.35) / 90 | 0) - 1;
    for (k = start; k < start + 12; k++) {
      x = (k * 90) - (G.camX * 0.35 % 90);
      const px = ox + x * s;
      const base = sy(GY - 8);
      const tall = 44 + hash2(k * 3 + 2) * 32;
      ctx.fillStyle = G.stage === 3 ? rgba(MAG, 0.16) : rgba(LEAF, G.stage === 2 ? 0.22 : 0.28);
      ctx.beginPath();
      ctx.moveTo(px, base);
      ctx.lineTo(px + 8 * s, base - tall * s);
      ctx.lineTo(px + 16 * s, base);
      ctx.fill();
      ctx.fillStyle = G.stage === 3 ? rgba(PNK, 0.4) : rgba(LEAF, 0.55);
      ctx.beginPath();
      ctx.ellipse(px + 8 * s, base - tall * s, 14 * s, 7 * s, 0, 0, TAU);
      ctx.fill();
    }
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
      ctx.fillStyle = p.base ? (G.stage === 3 ? '#241018' : G.stage === 2 ? '#0c2420' : '#142418') : '#1a3020';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = rgba(p.base ? HOT : GOLD, p.base ? 0.85 : 0.55);
      ctx.fillRect(x, y, w, 2.4 * s);
      ctx.fillStyle = rgba(CYN, 0.18);
      ctx.fillRect(x + 2 * s, y + 2.4 * s, w - 4 * s, 1.1 * s);
      if (p.base) {
        n = Math.max(2, (p.w / 28) | 0);
        for (k = 0; k <= n; k++) {
          ctx.fillStyle = k % 2 ? rgba(HOT, 0.2) : rgba(SAND, 0.26);
          ctx.fillRect(x + (k / n) * w, y, 2 * s, 5 * s);
        }
      }
    }
  }

  function drawBlock(b) {
    if (b.smashed && b.pop <= 0) return;
    const pop = b.pop > 0 ? 1 - b.pop / 0.22 : 1;
    const x = sx(b.x);
    const y = sy(b.y - BH / 2);
    const s = scale * (0.82 + pop * 0.18);
    const bob = b.smashed ? 0 : Math.sin(G.clock * 3 + b.x) * 1.2;
    ctx.save();
    ctx.translate(x, y + bob * scale);
    ctx.fillStyle = rgba(STONE, 0.95);
    ctx.fillRect(-11 * s, -11 * s, 22 * s, 22 * s);
    ctx.strokeStyle = rgba(GOLD, 0.95);
    ctx.lineWidth = 1.6 * s;
    ctx.strokeRect(-11 * s, -11 * s, 22 * s, 22 * s);
    ctx.fillStyle = rgba(b.kind === 'ghost' ? MAG : GOLD, 0.95);
    ctx.font = 'bold ' + (11 * s) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const glyph = b.kind === 'star' ? '★' : b.kind === 'rice' ? '饭' : b.kind === 'bag' ? '金' : b.kind === 'ghost' ? '灵' : '拳';
    ctx.fillText(glyph, 0, 0.5 * s);
    ctx.restore();
  }

  function drawUrchin(e) {
    const blink = e.hurt > 0 && ((G.t * 20) | 0) % 2 === 0;
    if (blink) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = rgba(MAG, 0.9);
    ctx.beginPath();
    ctx.arc(0, -8 * s, 8 * s, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(HOT, 0.9);
    ctx.lineWidth = 1.6 * s;
    let k;
    for (k = 0; k < 8; k++) {
      const a = k * TAU / 8 + e.t;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 6 * s, -8 * s + Math.sin(a) * 6 * s);
      ctx.lineTo(Math.cos(a) * 13 * s, -8 * s + Math.sin(a) * 13 * s);
      ctx.stroke();
    }
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.arc(3 * s, -10 * s, 1.6 * s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBird(e) {
    const blink = e.hurt > 0 && ((G.t * 20) | 0) % 2 === 0;
    if (blink) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale;
    const flap = 0.4 + Math.sin(G.clock * 26) * 0.35;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(e.face, 1);
    ctx.fillStyle = rgba(CYN, 0.5);
    ctx.beginPath();
    ctx.ellipse(-2 * s, -10 * s, 8 * s, 3.4 * s * flap, -0.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -4 * s, 7 * s, 5 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.beginPath();
    ctx.moveTo(7 * s, -4 * s);
    ctx.lineTo(12 * s, -2 * s);
    ctx.lineTo(7 * s, -1 * s);
    ctx.fill();
    ctx.fillStyle = '#102018';
    ctx.beginPath();
    ctx.arc(3 * s, -6 * s, 1.2 * s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawFish(e) {
    const blink = e.hurt > 0 && ((G.t * 20) | 0) % 2 === 0;
    if (blink) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(e.face, 1);
    ctx.fillStyle = rgba(SEA, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -8 * s, 10 * s, 5.5 * s, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-8 * s, -8 * s);
    ctx.lineTo(-14 * s, -13 * s);
    ctx.lineTo(-14 * s, -3 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.beginPath();
    ctx.arc(5 * s, -9 * s, 1.4 * s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawGhost(e) {
    const blink = e.hurt > 0 && ((G.t * 20) | 0) % 2 === 0;
    if (blink) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale;
    const bob = Math.sin(e.t * 5) * 2;
    ctx.save();
    ctx.translate(x, y + bob * s);
    ctx.scale(e.face, 1);
    ctx.fillStyle = rgba(PNK, 0.88);
    ctx.beginPath();
    ctx.arc(0, -12 * s, 8 * s, Math.PI, 0);
    ctx.lineTo(8 * s, -2 * s);
    ctx.lineTo(4 * s, -6 * s);
    ctx.lineTo(0, -2 * s);
    ctx.lineTo(-4 * s, -6 * s);
    ctx.lineTo(-8 * s, -2 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.beginPath();
    ctx.arc(3 * s, -14 * s, 2.2 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#180810';
    ctx.beginPath();
    ctx.arc(3.6 * s, -14 * s, 1 * s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawAlex(p) {
    const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
    const s = scale;
    const sq = p.squash || 1;
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.scale(p.face, sq);
    if (blink) ctx.globalAlpha = 0.38;

    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(0, 1.4 * s, 11 * s, 2.6 * s, 0, 0, TAU);
    ctx.fill();

    const punchP = p.pose > 0;
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.moveTo(-7 * s, -10 * s);
    ctx.lineTo(7 * s, -11 * s);
    ctx.lineTo(5.2 * s, -22 * s);
    ctx.lineTo(-5.2 * s, -21 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.fillRect(-6.4 * s, -13 * s, 12.8 * s, 2.2 * s);

    ctx.fillStyle = rgba(SKIN, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -30 * s, 7.4 * s, 7.6 * s, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-7.6 * s, -29 * s, 3.1 * s, 3.8 * s, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(7.6 * s, -29 * s, 3.1 * s, 3.8 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -35 * s, 7.8 * s, 3.6 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a1008';
    ctx.beginPath();
    ctx.arc(2.6 * s, -30 * s, 1.4 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.85);
    ctx.beginPath();
    ctx.arc(3.2 * s, -27 * s, 1.5 * s, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = rgba(SKIN, 0.9);
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(2 * s, -18 * s);
    ctx.lineTo(punchP ? 18 * s : 7 * s, punchP ? -16 * s : -13 * s);
    ctx.stroke();

    if (punchP) {
      ctx.fillStyle = rgba(CYN, 0.95);
      ctx.beginPath();
      ctx.arc(20 * s, -16 * s, 6.4 * s, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(HOT, 0.85);
      ctx.lineWidth = 2.2 * s;
      ctx.beginPath();
      ctx.arc(12 * s, -14 * s, 16 * s, -0.9, 0.7);
      ctx.stroke();
      ctx.strokeStyle = rgba(GOLD, 0.7);
      ctx.lineWidth = 1.3 * s;
      ctx.beginPath();
      ctx.arc(12 * s, -14 * s, 21 * s, -0.7, 0.5);
      ctx.stroke();
    }

    ctx.fillStyle = rgba(SKIN, 0.9);
    ctx.fillRect(-5 * s, -2 * s, 3.2 * s, 4 * s);
    ctx.fillRect(1.4 * s, -2 * s, 3.2 * s, 4 * s);

    if (G.starT > 0) {
      ctx.strokeStyle = rgba(GOLD, 0.65 + Math.sin(G.clock * 10) * 0.25);
      ctx.lineWidth = 1.5 * s;
      ctx.beginPath();
      ctx.arc(0, -18 * s, 17 * s, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFist(a) {
    const x = sx(a.x);
    const y = sy(a.y);
    const s = scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(a.face, 1);
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.beginPath();
    ctx.arc(0, 0, 7 * s, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(GOLD, 0.8);
    ctx.lineWidth = 1.6 * s;
    ctx.beginPath();
    ctx.arc(-2 * s, 0, 11 * s, -0.8, 0.8);
    ctx.stroke();
    ctx.restore();
  }

  function drawShot(o) {
    const x = sx(o.x);
    const y = sy(o.y);
    const s = scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = rgba(o.kind === 'paper' ? GOLD : o.back ? CYN : MAG, 0.92);
    ctx.beginPath();
    if (o.kind === 'paper') {
      ctx.rotate(G.clock * 8);
      ctx.fillRect(-7 * s, -7 * s, 14 * s, 14 * s);
    } else {
      ctx.moveTo(-8 * s, 0);
      ctx.lineTo(8 * s, -5 * s);
      ctx.lineTo(4 * s, 0);
      ctx.lineTo(8 * s, 5 * s);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawWave(o) {
    const x = sx(o.x);
    const y = sy(o.y);
    const s = scale;
    ctx.fillStyle = rgba(PNK, 0.5);
    ctx.beginPath();
    ctx.ellipse(x, y - 4 * s, o.w * 0.55 * s, 6 * s, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(MAG, 0.8);
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(x - o.w * 0.4 * s, y - 10 * s);
    ctx.lineTo(x, y - 20 * s);
    ctx.lineTo(x + o.w * 0.4 * s, y - 10 * s);
    ctx.stroke();
  }

  function drawBoss(b) {
    const blink = b.hurt > 0 && ((G.t * 20) | 0) % 2 === 0;
    if (blink) return;
    const x = sx(b.x);
    const y = sy(b.y);
    const s = scale * (b.name === '猜拳王' ? 1.25 : 1.1);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(b.face, 1);
    const col = b.stun > 0 ? GOLD : b.charge > 0 ? LAVA : MAG;
    ctx.fillStyle = rgba(col, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -16 * s, 16 * s, 16 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(SKIN, 0.5);
    ctx.beginPath();
    ctx.ellipse(-8 * s, -16 * s, 4 * s, 5 * s, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8 * s, -16 * s, 4 * s, 5 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.beginPath();
    ctx.ellipse(0, -26 * s, 12 * s, 5 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.beginPath();
    ctx.arc(5 * s, -18 * s, 3.4 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#180810';
    ctx.beginPath();
    ctx.arc(6 * s, -18 * s, 1.5 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.fillRect(-10 * s, -8 * s, 20 * s, 3 * s);
    ctx.fillStyle = rgba(MAG, 0.9);
    ctx.fillRect(-8 * s, -6 * s, 16 * s, 8 * s);

    const hand = inClash() ? G.clash.hand : b.hand;
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.beginPath();
    ctx.arc(18 * s, -14 * s, 7 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.font = 'bold ' + (9 * s) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(HANDS[hand] || '拳', 18 * s, -14 * s);
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
    ctx.fillStyle = rgba(inClash() ? GOLD : HOT, 0.9);
    ctx.fillRect(x, y, w * clamp(b.hp / b.max, 0, 1), 8 * scale);
    ctx.strokeStyle = rgba(GOLD, 0.55);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.font = 'bold ' + (11 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(b.name, ox + VW * 0.5 * scale, y - 3 * scale);
  }

  function drawClash() {
    if (!inClash()) return;
    const s = scale;
    const t = G.clash.t / G.clash.max;
    const cx = ox + VW * 0.5 * s;
    const cy = oy + 86 * s;
    ctx.fillStyle = 'rgba(7,16,12,0.42)';
    ctx.fillRect(ox, oy, VW * s, VH * s);
    ctx.strokeStyle = rgba(GOLD, 0.85);
    ctx.lineWidth = 4 * s;
    ctx.beginPath();
    ctx.arc(cx, cy - 6 * s, 26 * s, -Math.PI / 2, -Math.PI / 2 + TAU * t);
    ctx.stroke();
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.font = 'bold ' + (18 * s) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('猜拳', cx, cy - 38 * s);
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.font = 'bold ' + (22 * s) + 'px sans-serif';
    ctx.fillText(HANDS[G.clash.hand], cx, cy);
    const labels = ['石 ←', '剪 ↓', '布 →'];
    let i;
    for (i = 0; i < 3; i++) {
      const bx = ox + (VW * 0.5 - 120 + i * 120) * s;
      const by = oy + 210 * s;
      ctx.fillStyle = rgba(i === 1 ? CYN : HOT, 0.18);
      ctx.beginPath();
      ctx.arc(bx, by, 28 * s, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(i === 1 ? CYN : GOLD, 0.85);
      ctx.lineWidth = 2 * s;
      ctx.stroke();
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.font = 'bold ' + (16 * s) + 'px sans-serif';
      ctx.fillText(HANDS[i], bx, by + 2 * s);
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.font = (9 * s) + 'px sans-serif';
      ctx.fillText(labels[i], bx, by + 22 * s);
    }
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

  function drawEnt(e) {
    if (e.dead) return;
    if (e.kind === 'bird') drawBird(e);
    else if (e.kind === 'fish') drawFish(e);
    else if (e.kind === 'ghost') drawGhost(e);
    else drawUrchin(e);
  }

  function draw() {
    dpr = dpr || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#07100c';
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

    let i;
    for (i = 0; i < G.blocks.length; i++) drawBlock(G.blocks[i]);
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    if (G.boss && !G.boss.dead) drawBoss(G.boss);
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);
    for (i = 0; i < G.waves.length; i++) drawWave(G.waves[i]);
    for (i = 0; i < G.fists.length; i++) drawFist(G.fists[i]);
    if (G.player) drawAlex(G.player);
    drawFx();
    drawBossBar();
    drawClash();

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
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S'
      || k === 'z' || k === 'Z';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const jumpKey = k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up' || k === 'z' || k === 'Z';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (jumpKey) keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;

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
      startGame('isle');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('core');
      return;
    }
    if (inClash() && playing()) {
      if (k === '1' || k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') {
        pickHand(0);
        return;
      }
      if (k === '2' || k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down' || space) {
        pickHand(1);
        return;
      }
      if (k === '3' || k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') {
        pickHand(2);
        return;
      }
    }
    if (space || k === 'Enter') {
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
    hold(document.getElementById('btn-left'), function () {
      if (inClash()) pickHand(0);
      else keys.l = true;
    }, function () { keys.l = false; });
    hold(document.getElementById('btn-right'), function () {
      if (inClash()) pickHand(2);
      else keys.r = true;
    }, function () { keys.r = false; });
    hold(document.getElementById('btn-jump'), function () { keys.u = true; }, function () { keys.u = false; });
    hold(document.getElementById('btn-punch'), function () {
      if (overlayOpen()) { primaryAction(); return; }
      if (inClash()) pickHand(1);
      else doPunch();
    }, null);
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen()) return;
      if (inClash()) {
        const rect = canvas.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width;
        pickHand(nx < 0.33 ? 0 : nx > 0.66 ? 2 : 1);
        return;
      }
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
  if (modeIsle) {
    modeIsle.addEventListener('click', function () {
      audio.ensure();
      startGame('isle');
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
    }
  });

  requestAnimationFrame(frame);
})();
