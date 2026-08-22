'use strict';

(function () {
  const VW = 640;
  const VH = 360;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const HP_MAX = 100;
  const SPECIAL_COST = 18;
  const COMBO_WIN = 1.4;
  const BELT_TOP = 222;
  const BELT_BOT = 322;
  const WALK_X = 176;
  const WALK_Y = 112;
  const AIR = 0.88;
  const JUMP_V = 460;
  const GRAV = 1450;
  const MAX_FALL = 620;
  const COYOTE = 0.09;
  const BUFFER = 0.12;
  const INVULN = 1.35;
  const DIE_T = 0.78;
  const HURT_T = 0.38;
  const BEST_KEY = 'playbox-rage-street-best';
  const MUTE_KEY = 'playbox-rage-street-mute';
  const OPS = '方向键 / WASD 走 · 空格 / X 跳 · Z 拳 · C 爆发 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 34, 68];
  const HOT2 = [255, 106, 98];
  const WHT = [246, 240, 242];
  const LEAF = [61, 255, 122];
  const SKIN = [232, 184, 148];
  const PIPE_C = [196, 138, 58];
  const KNIFE_C = [200, 220, 240];
  const PUR = [176, 64, 220];

  const COMBO_PUNCH = [
    { dmg: 8, range: 36, dur: 0.16, hit0: 0.04, hit1: 0.12, kb: 70, stop: 0.042 },
    { dmg: 11, range: 40, dur: 0.18, hit0: 0.04, hit1: 0.13, kb: 90, stop: 0.05 },
    { dmg: 18, range: 46, dur: 0.3, hit0: 0.06, hit1: 0.18, kb: 220, stop: 0.072 }
  ];
  const PIPE_ATK = { dmg: 20, range: 58, dur: 0.26, hit0: 0.06, hit1: 0.18, kb: 240, stop: 0.06 };
  const JUMP_ATK = { dmg: 14, range: 38, dur: 0.28, hit0: 0.04, hit1: 0.22, kb: 140, stop: 0.05 };

  const FOES = {
    punk: {
      hp: 28, spd: 78, dmg: 12, range: 30, score: 100, w: 16, h: 30,
      think: 0.55, punchDur: 0.32, name: '青皮'
    },
    biker: {
      hp: 44, spd: 132, dmg: 16, range: 34, score: 200, w: 18, h: 32,
      think: 0.42, punchDur: 0.28, name: '飞车', charge: true
    },
    iron: {
      hp: 150, spd: 90, dmg: 18, range: 38, score: 4000, w: 22, h: 38,
      think: 0.4, punchDur: 0.36, name: '铁腕', boss: true
    },
    steel: {
      hp: 210, spd: 108, dmg: 20, range: 40, score: 5000, w: 24, h: 40,
      think: 0.34, punchDur: 0.32, name: '钢拳', boss: true, charge: true
    },
    black: {
      hp: 280, spd: 96, dmg: 22, range: 42, score: 8000, w: 22, h: 42,
      think: 0.3, punchDur: 0.34, name: '黑衣', boss: true
    }
  };

  const STAGES = [
    {
      name: '霓虹街', boss: '铁腕', w: 1880, theme: 'street', bossKind: 'iron',
      packs: [
        { x: 220, gate: 500, foes: [['punk', 280, 250], ['punk', 360, 290]] },
        { x: 540, gate: 840, foes: [['punk', 580, 240], ['punk', 660, 300], ['biker', 740, 270]] },
        { x: 880, gate: 1180, foes: [['punk', 920, 255], ['biker', 1000, 280], ['punk', 1100, 240]] },
        { x: 1240, gate: 1540, foes: [['biker', 1280, 260], ['punk', 1360, 300], ['punk', 1440, 245], ['biker', 1500, 285]] }
      ],
      drops: [[420, 268, 'pipe'], [980, 250, 'knife'], [720, 290, 'food'], [1380, 270, 'pipe']]
    },
    {
      name: '码头', boss: '钢拳', w: 2100, theme: 'dock', bossKind: 'steel',
      packs: [
        { x: 200, gate: 480, foes: [['punk', 250, 250], ['biker', 340, 290]] },
        { x: 520, gate: 860, foes: [['biker', 560, 255], ['punk', 640, 300], ['punk', 720, 240], ['biker', 800, 280]] },
        { x: 900, gate: 1240, foes: [['punk', 940, 250], ['biker', 1040, 270], ['punk', 1140, 300], ['biker', 1180, 240]] },
        { x: 1300, gate: 1680, foes: [['biker', 1340, 260], ['biker', 1440, 300], ['punk', 1520, 245], ['punk', 1600, 285], ['biker', 1660, 255]] }
      ],
      drops: [[400, 270, 'knife'], [780, 250, 'pipe'], [1100, 290, 'food'], [1480, 260, 'pipe'], [1600, 280, 'knife']]
    },
    {
      name: '夜楼', boss: '黑衣', w: 2320, theme: 'tower', bossKind: 'black',
      packs: [
        { x: 180, gate: 500, foes: [['punk', 230, 250], ['biker', 320, 290], ['punk', 400, 240]] },
        { x: 540, gate: 900, foes: [['biker', 580, 255], ['biker', 680, 300], ['punk', 760, 240], ['punk', 840, 280]] },
        { x: 960, gate: 1360, foes: [['punk', 1000, 250], ['biker', 1100, 270], ['biker', 1200, 300], ['punk', 1280, 240]] },
        { x: 1420, gate: 1860, foes: [['biker', 1460, 260], ['punk', 1540, 300], ['biker', 1640, 245], ['punk', 1720, 285], ['biker', 1800, 255]] }
      ],
      drops: [[380, 268, 'pipe'], [700, 250, 'food'], [1080, 290, 'knife'], [1320, 260, 'pipe'], [1700, 280, 'food'], [1780, 250, 'knife']]
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
  function comboMul(n) {
    return 1 + Math.min(4, Math.floor(Math.max(0, (n | 0) - 1) / 3));
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
  function wepName(wep, ammo) {
    if (wep === 'pipe') return '铁管×' + ammo;
    if (wep === 'knife') return '飞刀×' + ammo;
    return '拳头';
  }
  function stageAt(i) {
    return STAGES[((i | 0) % STAGES.length + STAGES.length) % STAGES.length];
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (SPECIAL_COST !== 18) throw new Error('special cost');
    if (COMBO_PUNCH.length !== 3) throw new Error('3 punch');
    if (comboMul(1) !== 1) throw new Error('combo 1');
    if (comboMul(3) !== 1) throw new Error('combo 3');
    if (comboMul(4) !== 2) throw new Error('combo 4');
    if (comboMul(13) !== 5) throw new Error('combo cap');
    const h = jumpHeight();
    if (h < 64 || h > 90) throw new Error('jump height ' + h);
    if (BELT_BOT - BELT_TOP < 80) throw new Error('belt');
    if (!FOES.punk || !FOES.biker || !FOES.iron) throw new Error('foes');
    if (!FOES.punk.hp || !FOES.biker.charge) throw new Error('foe stats');
    if (FOES.iron.hp >= FOES.steel.hp || FOES.steel.hp >= FOES.black.hp) throw new Error('boss hp');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (BEST_KEY !== 'playbox-rage-street-best') throw new Error('best key');
    if (MUTE_KEY !== 'playbox-rage-street-mute') throw new Error('mute key');
    if (wepName('pipe', 8) !== '铁管×8') throw new Error('pipe name');
    if (wepName('knife', 3) !== '飞刀×3') throw new Error('knife name');
    if (wepName('fist', 0) !== '拳头') throw new Error('fist name');
    let i, s;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.packs.length || !s.drops.length || !s.bossKind) throw new Error('stage ' + s.name);
    }
    if (PIPE_ATK.range <= COMBO_PUNCH[2].range) throw new Error('pipe range');
    if (SPECIAL_COST >= HP_MAX) throw new Error('special vs hp');
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
  const btnStreet = document.getElementById('btn-street');
  const btnEndless = document.getElementById('btn-endless');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeStreet = document.getElementById('mode-street');
  const modeEndless = document.getElementById('mode-endless');
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
  const wepLabel = document.getElementById('wep-label');
  const hpBar = document.getElementById('hp-bar');
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

  const keys = { l: false, r: false, u: false, d: false, punch: false, jump: false, spec: false };
  const punchEdge = { down: false, was: false };
  const jumpEdge = { down: false, was: false };
  const specEdge = { down: false, was: false };

  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const ghosts = [];

  const G = {
    mode: 'title',
    kind: 'street',
    clock: 0,
    stage: 1,
    wave: 1,
    camX: 0,
    levelW: 1880,
    theme: 'street',
    packs: [],
    enemies: [],
    drops: [],
    knives: [],
    player: null,
    boss: null,
    lives: LIVES,
    hp: HP_MAX,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    wep: 'fist',
    ammo: 0,
    stop: 0,
    shake: 0,
    kickX: 0,
    kickY: 0,
    flash: 0,
    flashRgb: HOT,
    invuln: 0,
    deadT: 0,
    intro: 0,
    clearT: 0,
    waveWait: 0,
    arenaL: 0,
    arenaR: 640,
    nextLife: LIFE_EVERY,
    why: '',
    won: false,
    hudDirty: true
  };

  function overlayOpen() {
    return overlay && !overlay.classList.contains('hidden');
  }
  function playing() {
    return G.mode === 'play';
  }
  function live() {
    return G.mode === 'play' || G.mode === 'title';
  }
  function inputOk() {
    return G.mode === 'play' && !overlayOpen() && G.deadT <= 0;
  }

  /* ---- audio ---- */
  const audio = {
    ctx: null,
    master: null,
    muted: false,
    noiseBuf: null,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.4;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.4;
      if (btnMute) {
        btnMute.textContent = m ? '静' : '声';
        btnMute.classList.toggle('muted', m);
        btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      }
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (e) { /* ignore */ }
    },
    beep: function (freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(Math.max(0.0001, vol), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.03);
    },
    noise: function (dur, vol, freq, type) {
      if (!this.ctx || this.muted) return;
      if (!this.noiseBuf) {
        const sr = this.ctx.sampleRate;
        const buf = this.ctx.createBuffer(1, (sr * 0.45) | 0, sr);
        const data = buf.getChannelData(0);
        let i;
        for (i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const f = this.ctx.createBiquadFilter();
      f.type = type || 'bandpass';
      f.frequency.value = freq || 900;
      f.Q.value = type === 'lowpass' ? 0.7 : 1.15;
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
    swing: function () {
      this.ensure();
      this.noise(0.07, 0.07, 1100, 'highpass');
      this.beep(190, 0.05, 'sawtooth', 0.03, 70);
    },
    hit: function (combo, heavy) {
      this.ensure();
      const p = 1 + Math.min(6, combo) * 0.06;
      this.noise(0.12, heavy ? 0.2 : 0.14, 220, 'lowpass');
      this.beep(160 * p, 0.1, 'square', 0.08, 58);
      this.beep((heavy ? 880 : 640) * p, 0.07, 'triangle', 0.05, 380 * p);
      if (heavy) this.beep(1180 * p, 0.09, 'square', 0.04, 1540 * p);
    },
    special: function () {
      this.ensure();
      this.noise(0.28, 0.22, 180, 'lowpass');
      this.beep(140, 0.22, 'sawtooth', 0.09, 50);
      this.beep(520, 0.16, 'square', 0.07, 980);
      this.beep(880, 0.2, 'triangle', 0.05, 1400);
    },
    throw: function () {
      this.ensure();
      this.noise(0.08, 0.08, 1800, 'highpass');
      this.beep(720, 0.07, 'square', 0.04, 420);
    },
    pickup: function () {
      this.ensure();
      this.beep(520, 0.06, 'square', 0.045, 780);
      this.beep(780, 0.08, 'triangle', 0.04, 1040);
    },
    food: function () {
      this.ensure();
      this.beep(392, 0.07, 'sine', 0.05, 523);
      this.beep(523, 0.1, 'triangle', 0.045, 784);
    },
    hurt: function () {
      this.ensure();
      this.noise(0.16, 0.14, 240, 'lowpass');
      this.beep(280, 0.16, 'sawtooth', 0.05, 70);
    },
    ko: function () {
      this.ensure();
      this.noise(0.22, 0.16, 140, 'lowpass');
      this.beep(120, 0.26, 'sine', 0.07, 48);
    },
    jump: function () {
      this.ensure();
      this.beep(360, 0.07, 'square', 0.03, 180);
    },
    land: function () {
      this.ensure();
      this.noise(0.05, 0.05, 280, 'lowpass');
    },
    win: function () {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.05, 659);
      this.beep(659, 0.1, 'square', 0.05, 784);
      this.beep(1046, 0.18, 'triangle', 0.045, 1318);
    },
    over: function () {
      this.ensure();
      this.beep(196, 0.18, 'sawtooth', 0.05, 98);
      this.beep(130, 0.28, 'square', 0.04, 60);
    },
    ui: function () {
      this.ensure();
      this.beep(640, 0.05, 'square', 0.035, 420);
    },
    combo: function (n) {
      this.ensure();
      this.beep(440 + n * 42, 0.08, 'square', 0.05, 880 + n * 48);
    },
    start: function () {
      this.ensure();
      this.beep(330, 0.08, 'square', 0.04, 440);
      this.beep(440, 0.1, 'triangle', 0.04, 660);
    },
    oneup: function () {
      this.ensure();
      this.beep(523, 0.07, 'square', 0.05, 784);
      this.beep(784, 0.12, 'triangle', 0.045, 1046);
    }
  };

  function loadBest() {
    try {
      const n = parseInt(localStorage.getItem(BEST_KEY), 10);
      if (n > 0) G.best = n;
    } catch (e) { /* ignore */ }
  }
  function persistBest() {
    if (G.score > G.best) G.best = G.score;
    try { localStorage.setItem(BEST_KEY, String(G.best)); } catch (e) { /* ignore */ }
  }

  /* ---- fx ---- */
  function hitStop(t) {
    if (REDUCE) return;
    if (t > G.stop) G.stop = t;
  }
  function shake(n) {
    if (REDUCE) return;
    G.shake = Math.max(G.shake, n);
  }
  function kick(kx, ky) {
    if (REDUCE) return;
    G.kickX = kx;
    G.kickY = ky;
    if (!stageEl) return;
    stageEl.classList.remove('hit');
    void stageEl.offsetWidth;
    stageEl.classList.add('hit');
    clearTimeout(kickTok);
    kickTok = setTimeout(function () { stageEl.classList.remove('hit'); }, 160);
  }
  function dieKick() {
    if (REDUCE || !stageEl) return;
    stageEl.classList.remove('die');
    void stageEl.offsetWidth;
    stageEl.classList.add('die');
    setTimeout(function () { stageEl.classList.remove('die'); }, 340);
  }
  function boomKick() {
    if (REDUCE || !stageEl) return;
    stageEl.classList.remove('boom');
    void stageEl.offsetWidth;
    stageEl.classList.add('boom');
    setTimeout(function () { stageEl.classList.remove('boom'); }, 180);
  }
  function pickupKick() {
    if (REDUCE || !stageEl) return;
    stageEl.classList.remove('pickup');
    void stageEl.offsetWidth;
    stageEl.classList.add('pickup');
    setTimeout(function () { stageEl.classList.remove('pickup'); }, 440);
  }
  function winKick() {
    if (REDUCE || !stageEl) return;
    stageEl.classList.remove('win-flash');
    void stageEl.offsetWidth;
    stageEl.classList.add('win-flash');
    setTimeout(function () { stageEl.classList.remove('win-flash'); }, 720);
  }
  function flash(rgb, t) {
    G.flashRgb = rgb;
    G.flash = t;
  }
  function burst(x, y, n, rgb, spd, life) {
    let i, cap;
    cap = 180 - particles.length;
    if (n > cap) n = cap < 0 ? 0 : cap;
    if (REDUCE) n = Math.min(n, 8);
    for (i = 0; i < n; i++) {
      particles.push({
        x: x, y: y,
        vx: rand(-1, 1) * spd,
        vy: rand(-1.15, 0.35) * spd,
        t: life * rand(0.55, 1.2),
        max: life,
        r: rand(1.1, 2.8),
        rgb: rgb
      });
    }
  }
  function spark(x, y, rgb, n) {
    let i;
    if (REDUCE) n = Math.min(n, 4);
    for (i = 0; i < n; i++) {
      sparks.push({
        x: x, y: y,
        vx: rand(-1, 1) * 140,
        vy: rand(-160, -20),
        t: rand(0.1, 0.28),
        rgb: rgb
      });
    }
  }
  function ringAt(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0.45, rgb: rgb, r: 8 });
  }
  function pop(x, y, text, rgb) {
    floats.push({ x: x, y: y, vy: -42, text: text, rgb: rgb, t: 0.9, life: 0.9 });
  }
  function ghostAt(e, a) {
    if (REDUCE) return;
    ghosts.push({
      x: e.x, y: e.y, h: e.h, face: e.face, t: 0.22,
      a: a || 0.35, kind: e.kind || 'player'
    });
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
      if (tok === chainTok) chainPop.classList.add('hidden');
    }, 700);
  }
  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastTok += 1;
    const tok = toastTok;
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden', 'warn', 'gold');
    if (warn) toastEl.classList.add('warn');
    if (gold) toastEl.classList.add('gold');
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1100);
  }
  function bumpScore(n) {
    if (n <= 0) return;
    G.score += n | 0;
    persistBest();
    while (G.score >= G.nextLife) {
      G.nextLife += LIFE_EVERY;
      if (G.lives < LIFE_CAP) {
        G.lives += 1;
        audio.oneup();
        toast('1UP', false, true);
        G.hudDirty = true;
      }
    }
    if (!scoreAdd || !scoreBox) return;
    scoreAdd.hidden = false;
    scoreAdd.textContent = '+' + n;
    scoreBox.classList.remove('flash');
    void scoreBox.offsetWidth;
    scoreBox.classList.add('flash');
    addTok += 1;
    const tok = addTok;
    setTimeout(function () {
      if (tok === addTok) scoreAdd.hidden = true;
    }, 700);
    G.hudDirty = true;
  }
  function bumpCombo() {
    const prev = comboMul(G.combo);
    G.combo += 1;
    G.comboT = COMBO_WIN;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    const mul = comboMul(G.combo);
    if (comboBox) {
      comboBox.classList.remove('hot');
      void comboBox.offsetWidth;
      comboBox.classList.add('hot');
    }
    if (mul > prev) {
      showChain(mul);
      audio.combo(mul);
    }
    G.hudDirty = true;
    return mul;
  }
  function breakCombo() {
    if (G.combo > 0) G.hudDirty = true;
    G.combo = 0;
    G.comboT = 0;
  }
  function resetFx() {
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    ghosts.length = 0;
    G.stop = 0;
    G.shake = 0;
    G.kickX = 0;
    G.kickY = 0;
    G.flash = 0;
  }
  function tickFx(dt) {
    let i, p;
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.shake *= Math.max(0, 1 - dt * 7);
    G.kickX *= Math.max(0, 1 - dt * 10);
    G.kickY *= Math.max(0, 1 - dt * 10);
    if (G.shake < 0.2) G.shake = 0;
    for (i = particles.length - 1; i >= 0; i--) {
      p = particles[i];
      p.t -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 90 * dt;
      if (p.t <= 0) particles.splice(i, 1);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      p = sparks[i];
      p.t -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 240 * dt;
      if (p.t <= 0) sparks.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      p = rings[i];
      p.t -= dt;
      if (p.t <= 0) rings.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      p = floats[i];
      p.t -= dt;
      p.y += p.vy * dt;
      if (p.t <= 0) floats.splice(i, 1);
    }
    for (i = ghosts.length - 1; i >= 0; i--) {
      p = ghosts[i];
      p.t -= dt;
      if (p.t <= 0) ghosts.splice(i, 1);
    }
    capArr(particles, 180);
    capArr(sparks, 80);
    capArr(ghosts, 16);
  }

  /* ---- hud / overlay ---- */
  function setHint(t, cls) {
    if (!hintEl) return;
    hintEl.textContent = t;
    hintEl.classList.remove('hot', 'warn');
    if (cls) hintEl.classList.add(cls);
  }
  function showOverlay() {
    overlay.classList.remove('hidden', 'end');
  }
  function showEndOverlay() {
    overlay.classList.remove('hidden');
    overlay.classList.add('end');
  }
  function hideOverlay() {
    overlay.classList.add('hidden');
    overlay.classList.remove('end');
  }
  function setModes(kind) {
    if (modeStreet) modeStreet.setAttribute('aria-pressed', kind === 'street' ? 'true' : 'false');
    if (modeEndless) modeEndless.setAttribute('aria-pressed', kind === 'endless' ? 'true' : 'false');
  }
  function syncHud() {
    const p = G.player;
    const hp = p ? p.hp : G.hp;
    const max = p ? p.maxHp : HP_MAX;
    if (scoreEl) scoreEl.textContent = String(G.score | 0);
    if (bestEl) bestEl.textContent = String(G.best | 0);
    if (comboEl) comboEl.textContent = '×' + comboMul(G.combo);
    if (hpBar) {
      hpBar.style.transform = 'scaleX(' + clamp(hp / max, 0, 1) + ')';
      hpBar.classList.toggle('low', hp / max < 0.32);
    }
    if (wepLabel) {
      wepLabel.textContent = wepName(G.wep, G.ammo);
      wepLabel.classList.toggle('hot', G.wep === 'pipe');
      wepLabel.classList.toggle('knife', G.wep === 'knife');
    }
    if (tagLabel) {
      tagLabel.textContent = G.kind === 'endless' ? '无尽' : '街区';
      tagLabel.classList.toggle('warn', G.kind === 'endless');
    }
    if (stageLabel) {
      if (G.kind === 'endless') stageLabel.textContent = '第 ' + G.wave + ' 波';
      else stageLabel.textContent = stageAt(G.stage - 1).name;
      stageLabel.classList.toggle('hot', !!G.boss);
    }
    if (pipsEl) {
      const n = Math.max(LIVES, G.lives);
      let html = '';
      let i;
      for (i = 0; i < n; i++) {
        html += '<i class="pip' + (i < G.lives ? ' on' : ' gone') + '"></i>';
      }
      pipsEl.innerHTML = html;
    }
    G.hudDirty = false;
  }

  /* ---- factories ---- */
  function makePlayer(x, y) {
    return {
      id: uid++,
      kind: 'player',
      x: x, y: y, h: 0, vh: 0,
      vx: 0, vy: 0,
      face: 1,
      hp: HP_MAX,
      maxHp: HP_MAX,
      act: 'idle',
      t: 0,
      step: 0,
      punch: 0,
      comboStep: 0,
      hit: false,
      coyote: 0,
      jumpBuf: 0,
      punchBuf: 0,
      specBuf: 0,
      stun: 0,
      grounded: true,
      run: 0,
      blink: 0
    };
  }
  function makeFoe(kind, x, y, scaleHp) {
    const spec = FOES[kind];
    const e = {
      id: uid++,
      kind: kind,
      spec: spec,
      x: x, y: y, h: 0, vh: 0,
      vx: 0, vy: 0,
      face: -1,
      hp: Math.round(spec.hp * (scaleHp || 1)),
      maxHp: Math.round(spec.hp * (scaleHp || 1)),
      act: 'idle',
      t: rand(0.1, spec.think),
      step: 0,
      punch: 0,
      hit: false,
      stun: 0,
      grounded: true,
      dead: false,
      deadT: 0,
      charge: 0,
      boss: !!spec.boss,
      flashT: 0,
      think: spec.think,
      pack: -1
    };
    return e;
  }
  function makeDrop(x, y, kind) {
    return { x: x, y: y, kind: kind, bob: rand(0, TAU), taken: false };
  }
  function makeKnife(x, y, h, face, from) {
    return {
      x: x, y: y, h: h, face: face,
      vx: face * 380, life: 0.72, from: from || 'player'
    };
  }

  function lookOf(kind) {
    if (kind === 'player') {
      return { jacket: HOT, pants: [42, 72, 168], hair: GOLD, skin: SKIN, accent: CYN, hairStyle: 'axel', size: 1 };
    }
    if (kind === 'punk') {
      return { jacket: GOLD, pants: [36, 32, 44], hair: PUR, skin: SKIN, accent: MAG, hairStyle: 'mohawk', size: 1 };
    }
    if (kind === 'biker') {
      return { jacket: [32, 28, 38], pants: [22, 20, 28], hair: [20, 18, 22], skin: [210, 160, 120], accent: HOT, hairStyle: 'helm', size: 1.04 };
    }
    if (kind === 'iron') {
      return { jacket: [200, 40, 48], pants: [28, 28, 36], hair: [24, 20, 18], skin: [196, 140, 108], accent: GOLD, hairStyle: 'bald', size: 1.22 };
    }
    if (kind === 'steel') {
      return { jacket: [24, 22, 30], pants: [18, 16, 22], hair: [16, 14, 18], skin: [180, 130, 100], accent: CYN, hairStyle: 'helm', size: 1.28 };
    }
    return { jacket: [18, 16, 22], pants: [12, 12, 16], hair: [8, 8, 10], skin: [168, 120, 96], accent: GOLD, hairStyle: 'slick', size: 1.26 };
  }

  /* ---- world helpers ---- */
  function clampBelt(e) {
    e.y = clamp(e.y, BELT_TOP, BELT_BOT);
    e.x = clamp(e.x, G.arenaL + 18, G.arenaR - 18);
  }
  function grounded(e) {
    return e.h <= 0.5;
  }
  function facingToward(e, tx) {
    if (tx > e.x + 4) e.face = 1;
    else if (tx < e.x - 4) e.face = -1;
  }
  function depthHit(a, b) {
    return Math.abs(a.y - b.y) < 16;
  }
  function heightHit(a, b) {
    const ah = a.h || 0;
    const bh = b.h || 0;
    return Math.abs(ah - bh) < 28 || (ah > 8 && bh < 8) || (bh > 8 && ah < 8);
  }

  function setWep(kind, ammo) {
    G.wep = kind;
    G.ammo = ammo;
    G.hudDirty = true;
  }

  /* ---- combat ---- */
  function hurtEnemy(e, dmg, kb, face, finisher) {
    if (e.dead) return;
    if (G.mode !== 'play') {
      e.hp -= dmg;
      e.stun = 0.2;
      e.act = e.hp <= 0 ? 'down' : 'hurt';
      e.t = e.hp <= 0 ? 0.45 : 0.22;
      e.vx = face * kb * 0.6;
      e.flashT = 0.1;
      if (e.hp <= 0) {
        e.dead = true;
        e.deadT = 0.5;
        e.act = 'down';
      }
      return;
    }
    e.hp -= dmg;
    e.stun = finisher ? 0.42 : 0.28;
    e.act = e.hp <= 0 ? 'down' : 'hurt';
    e.t = e.hp <= 0 ? 0.55 : 0.28;
    e.vx = face * kb;
    e.vy = 0;
    e.charge = 0;
    e.flashT = 0.12;
    e.face = -face;
    if (finisher || e.hp <= 0) {
      e.vh = 90 + (finisher ? 80 : 0);
      e.h = Math.max(e.h, 4);
    }
    const mul = bumpCombo();
    const kill = Math.round(e.spec.score * mul);
    const chip = Math.max(10, Math.round((12 + dmg) * mul));
    if (e.hp <= 0) {
      e.dead = true;
      e.deadT = 0.62;
      e.act = 'down';
      bumpScore(kill);
      pop(e.x, e.y - 36 - e.h, '+' + kill, GOLD);
      burst(e.x, e.y - 18 - e.h, 16, e.kind === 'biker' ? CYN : MAG, 180, 0.42);
      if (e.boss) {
        burst(e.x, e.y - 24, 28, GOLD, 240, 0.55);
        flash(GOLD, 0.55);
        audio.ko();
      }
      maybeDrop(e);
    } else {
      bumpScore(chip);
      pop(e.x, e.y - 32 - e.h, '+' + chip, WHT);
    }
    G.hudDirty = true;
  }

  function maybeDrop(e) {
    if (G.mode !== 'play') return;
    let roll = Math.random();
    if (e.boss) {
      G.drops.push(makeDrop(e.x, e.y, Math.random() < 0.5 ? 'pipe' : 'food'));
      return;
    }
    if (roll < 0.1) G.drops.push(makeDrop(e.x, e.y, 'food'));
    else if (roll < 0.18) G.drops.push(makeDrop(e.x, e.y, 'pipe'));
    else if (roll < 0.24) G.drops.push(makeDrop(e.x, e.y, 'knife'));
  }

  function hurtPlayer(dmg, face, why) {
    const p = G.player;
    if (!p || G.invuln > 0 || p.act === 'special' || G.deadT > 0) return;
    if (G.mode !== 'play') return;
    p.hp -= dmg;
    G.hp = p.hp;
    breakCombo();
    p.act = 'hurt';
    p.t = HURT_T;
    p.stun = HURT_T;
    p.vx = face * 160;
    p.punch = 0;
    p.comboStep = 0;
    G.invuln = 0.55;
    audio.hurt();
    flash(MAG, 0.28);
    shake(7);
    kick(face * 5, 2);
    burst(p.x, p.y - 20 - p.h, 10, HOT, 140, 0.32);
    G.why = why || '被打倒了';
    G.hudDirty = true;
    if (p.hp <= 0) {
      p.hp = 0;
      G.hp = 0;
      loseLife(why || '血空了');
    }
  }

  function loseLife(why) {
    const p = G.player;
    G.why = why;
    G.deadT = DIE_T;
    G.lives -= 1;
    G.hudDirty = true;
    if (p) {
      p.act = 'down';
      p.t = DIE_T;
      p.hp = 0;
    }
    audio.ko();
    dieKick();
    flash(HOT, 0.5);
    shake(11);
    if (G.lives < 0) {
      G.lives = 0;
      G.deadT = DIE_T;
    }
  }

  function respawn() {
    const p = G.player;
    if (G.lives <= 0) {
      showOver(false);
      return;
    }
    if (!p) return;
    p.hp = HP_MAX;
    p.maxHp = HP_MAX;
    G.hp = HP_MAX;
    p.act = 'idle';
    p.t = 0;
    p.h = 0;
    p.vh = 0;
    p.vx = 0;
    p.stun = 0;
    p.punch = 0;
    p.comboStep = 0;
    G.deadT = 0;
    G.invuln = INVULN;
    setWep('fist', 0);
    G.hudDirty = true;
    toast('再上', false, true);
  }

  function currentAtk(p) {
    if (p.act === 'jumpPunch') return JUMP_ATK;
    if (p.act === 'punch' && G.wep === 'pipe') return PIPE_ATK;
    if (p.act === 'punch') return COMBO_PUNCH[p.comboStep] || COMBO_PUNCH[0];
    return null;
  }

  function tryPunch() {
    const p = G.player;
    if (!p || !inputOk()) return false;
    if (p.act === 'hurt' || p.act === 'down' || p.act === 'special') return false;
    if (!grounded(p)) {
      if (p.act === 'jump' || p.act === 'idle' || p.act === 'walk') {
        p.act = 'jumpPunch';
        p.t = JUMP_ATK.dur;
        p.hit = false;
        audio.swing();
        return true;
      }
      return false;
    }
    if (G.wep === 'knife' && G.ammo > 0) {
      p.act = 'throw';
      p.t = 0.2;
      p.hit = false;
      G.ammo -= 1;
      G.knives.push(makeKnife(p.x + p.face * 16, p.y, 14, p.face, 'player'));
      audio.throw();
      if (G.ammo <= 0) setWep('fist', 0);
      G.hudDirty = true;
      return true;
    }
    if (p.act === 'punch') {
      const atk = currentAtk(p);
      if (atk && (atk.dur - p.t) > 0.05 && p.comboStep < 2 && G.wep !== 'pipe') {
        p.comboStep += 1;
        const n = COMBO_PUNCH[p.comboStep];
        p.t = n.dur;
        p.hit = false;
        audio.swing();
        return true;
      }
      return false;
    }
    p.act = 'punch';
    p.comboStep = 0;
    p.t = G.wep === 'pipe' ? PIPE_ATK.dur : COMBO_PUNCH[0].dur;
    p.hit = false;
    audio.swing();
    return true;
  }

  function tryJump() {
    const p = G.player;
    if (!p || !inputOk()) return;
    if (p.act === 'hurt' || p.act === 'down' || p.act === 'special' || p.act === 'punch' || p.act === 'throw') {
      p.jumpBuf = BUFFER;
      return;
    }
    if (p.coyote > 0 || grounded(p)) {
      p.vh = JUMP_V;
      p.h = Math.max(p.h, 2);
      p.act = 'jump';
      p.coyote = 0;
      p.jumpBuf = 0;
      audio.jump();
    } else {
      p.jumpBuf = BUFFER;
    }
  }

  function trySpecial() {
    const p = G.player;
    if (!p || !inputOk()) return;
    if (p.act === 'special' || p.act === 'down' || p.act === 'hurt') return;
    if (p.hp <= 0) return;
    p.hp -= SPECIAL_COST;
    G.hp = p.hp;
    p.act = 'special';
    p.t = 0.55;
    p.hit = false;
    p.vh = 80;
    p.h = Math.max(p.h, 8);
    audio.special();
    flash(CYN, 0.55);
    shake(10);
    boomKick();
    ringAt(p.x, p.y - 10, CYN);
    burst(p.x, p.y - 18, 28, CYN, 260, 0.5);
    burst(p.x, p.y - 18, 18, GOLD, 200, 0.42);
    pop(p.x, p.y - 48, '爆发', CYN);
    G.hudDirty = true;
    hitStop(0.08);
    if (p.hp <= 0) {
      p.hp = 0;
      G.hp = 0;
      G.why = '爆发耗尽';
    }
  }

  function doPlayerHits(p) {
    if (p.act === 'special') {
      if (p.hit) return;
      p.hit = true;
      let i, e, n = 0;
      for (i = 0; i < G.enemies.length; i++) {
        e = G.enemies[i];
        if (e.dead) continue;
        if (hypot(e.x - p.x, (e.y - p.y) * 1.4) < 86) {
          hurtEnemy(e, 24, 280, e.x >= p.x ? 1 : -1, true);
          n += 1;
        }
      }
      if (n) {
        audio.hit(G.combo, true);
        kick(0, 4);
      }
      return;
    }
    const atk = currentAtk(p);
    if (!atk || p.hit) return;
    const elapsed = (p.act === 'jumpPunch' ? JUMP_ATK.dur : atk.dur) - p.t;
    if (elapsed < atk.hit0 || elapsed > atk.hit1) return;
    let i, e, hitAny = false;
    const finisher = p.act === 'punch' && (p.comboStep >= 2 || G.wep === 'pipe');
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (e.dead) continue;
      if (!depthHit(p, e) || !heightHit(p, e)) continue;
      const dx = (e.x - p.x) * p.face;
      if (dx < 6 || dx > atk.range + 8) continue;
      hurtEnemy(e, atk.dmg, atk.kb, p.face, finisher);
      hitAny = true;
    }
    if (hitAny) {
      p.hit = true;
      audio.hit(G.combo, finisher);
      hitStop(atk.stop);
      shake(finisher ? 7 : 4);
      kick(p.face * (finisher ? 6 : 3), finisher ? 3 : 1);
      burst(p.x + p.face * 28, p.y - 18 - p.h, finisher ? 14 : 8, finisher ? GOLD : WHT, 160, 0.32);
      spark(p.x + p.face * 28, p.y - 20 - p.h, GOLD, finisher ? 8 : 4);
      if (G.wep === 'pipe' && p.act === 'punch') {
        G.ammo -= 1;
        if (G.ammo <= 0) setWep('fist', 0);
        G.hudDirty = true;
      }
    }
  }

  /* ---- player tick ---- */
  function tickPlayer(dt, demo) {
    const p = G.player;
    if (!p) return;
    const left = demo ? demo.l : keys.l;
    const right = demo ? demo.r : keys.r;
    const up = demo ? demo.u : keys.u;
    const down = demo ? demo.d : keys.d;
    const wantPunch = demo ? demo.punch : false;

    p.jumpBuf = Math.max(0, p.jumpBuf - dt);
    p.coyote = Math.max(0, p.coyote - dt);
    p.stun = Math.max(0, p.stun - dt);
    p.run += dt;

    p.punchBuf = Math.max(0, p.punchBuf - dt);
    p.specBuf = Math.max(0, p.specBuf - dt);
    if (!demo && inputOk()) {
      if (punchEdge.down) p.punchBuf = BUFFER;
      if (specEdge.down) p.specBuf = BUFFER;
      punchEdge.down = false;
      if (p.punchBuf > 0 && tryPunch()) p.punchBuf = 0;
      else if (keys.punch && p.act === 'punch') tryPunch();
      if (jumpEdge.down) { tryJump(); jumpEdge.down = false; }
      if (p.specBuf > 0) { trySpecial(); p.specBuf = 0; specEdge.down = false; }
    } else if (demo && wantPunch) {
      const near = G.enemies.some(function (e) {
        return !e.dead && Math.abs(e.x - p.x) < 42 && depthHit(p, e);
      });
      if (near && p.act !== 'punch' && p.act !== 'special') tryPunchDemo(p);
    }

    if (p.act === 'hurt' || p.act === 'down') {
      p.t -= dt;
      p.vx *= Math.max(0, 1 - dt * 5);
      p.x += p.vx * dt;
      applyJump(p, dt);
      clampBelt(p);
      if (p.act === 'down' && G.mode === 'play') return;
      if (p.t <= 0 && p.act === 'hurt') {
        p.act = 'idle';
        p.vx = 0;
      }
      return;
    }

    if (p.act === 'special') {
      p.t -= dt;
      p.vx = p.face * 40;
      p.x += p.vx * dt;
      if ((p.t * 20 | 0) !== ((p.t + dt) * 20 | 0)) ghostAt(p, 0.4);
      applyJump(p, dt);
      doPlayerHits(p);
      clampBelt(p);
      if (p.t <= 0) {
        if (p.hp <= 0) loseLife('爆发耗尽');
        else p.act = grounded(p) ? 'idle' : 'jump';
      }
      return;
    }

    if (p.act === 'punch' || p.act === 'throw' || p.act === 'jumpPunch') {
      p.t -= dt;
      p.vx *= Math.max(0, 1 - dt * 6);
      p.x += p.vx * dt;
      if (up) p.y -= WALK_Y * 0.25 * dt;
      if (down) p.y += WALK_Y * 0.25 * dt;
      applyJump(p, dt);
      if (p.act !== 'throw') doPlayerHits(p);
      clampBelt(p);
      if (p.t <= 0) {
        if (p.act === 'jumpPunch') p.act = grounded(p) ? 'idle' : 'jump';
        else p.act = grounded(p) ? 'idle' : 'jump';
        p.comboStep = 0;
      }
      return;
    }

    let ix = (right ? 1 : 0) - (left ? 1 : 0);
    let iy = (down ? 1 : 0) - (up ? 1 : 0);
    if (ix) p.face = ix;
    const air = !grounded(p);
    const spdX = WALK_X * (air ? AIR : 1);
    const spdY = WALK_Y * (air ? 0.7 : 1);
    p.vx = ix * spdX;
    p.vy = iy * spdY;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (ix || iy) p.step += dt * 9;
    applyJump(p, dt);
    if (p.jumpBuf > 0 && (p.coyote > 0 || grounded(p))) tryJump();
    if (air) {
      if (p.act !== 'jumpPunch') p.act = 'jump';
    } else if (ix || iy) p.act = 'walk';
    else p.act = 'idle';
    clampBelt(p);
  }

  function tryPunchDemo(p) {
    if (p.act === 'punch' || p.act === 'special' || p.act === 'hurt') return;
    p.act = 'punch';
    p.comboStep = 0;
    p.t = COMBO_PUNCH[0].dur;
    p.hit = false;
  }

  function applyJump(p, dt) {
    const was = grounded(p);
    p.vh -= GRAV * dt;
    if (p.vh < -MAX_FALL) p.vh = -MAX_FALL;
    p.h += p.vh * dt;
    if (p.h <= 0) {
      p.h = 0;
      if (!was && p.vh < -80 && G.mode === 'play') audio.land();
      p.vh = 0;
      p.coyote = COYOTE;
      p.grounded = true;
    } else {
      p.grounded = false;
    }
  }

  /* ---- enemy AI ---- */
  function attackers() {
    let n = 0, i, e;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (e.dead) continue;
      if (e.act === 'punch' || e.act === 'charge') n += 1;
    }
    return n;
  }

  function tickEnemy(e, dt) {
    const p = G.player;
    if (e.flashT > 0) e.flashT -= dt;
    if (e.dead) {
      e.deadT -= dt;
      e.vx *= Math.max(0, 1 - dt * 3);
      e.x += e.vx * dt;
      applyJump(e, dt);
      return;
    }
    if (e.stun > 0 || e.act === 'hurt' || e.act === 'down') {
      e.stun -= dt;
      e.t -= dt;
      e.vx *= Math.max(0, 1 - dt * 4.5);
      e.x += e.vx * dt;
      applyJump(e, dt);
      clampBelt(e);
      if (e.t <= 0 && e.act === 'hurt') {
        e.act = 'idle';
        e.t = e.think;
      }
      return;
    }

    if (!p) return;
    const dx = p.x - e.x;
    const dy = p.y - e.y;
    facingToward(e, p.x);
    e.step += dt * 7;

    if (e.act === 'punch') {
      e.t -= dt;
      e.vx *= Math.max(0, 1 - dt * 8);
      e.x += e.vx * dt;
      applyJump(e, dt);
      clampBelt(e);
      const elapsed = e.spec.punchDur - e.t;
      if (!e.hit && elapsed > 0.1 && elapsed < 0.22) {
        if (G.mode === 'play' && depthHit(e, p) && heightHit(e, p) && (p.x - e.x) * e.face > 4 && (p.x - e.x) * e.face < e.spec.range + 10) {
          e.hit = true;
          hurtPlayer(e.spec.dmg, e.face, e.boss ? e.spec.name + '击倒了你' : (e.kind === 'biker' ? '被飞车踢中了' : '被青皮打中了'));
        }
      }
      if (e.t <= 0) {
        e.act = 'idle';
        e.t = e.think * rand(0.6, 1.2);
      }
      return;
    }

    if (e.act === 'charge') {
      e.t -= dt;
      e.x += e.face * (e.spec.spd * 2.1) * dt;
      applyJump(e, dt);
      clampBelt(e);
      if (!e.hit && G.mode === 'play' && depthHit(e, p) && Math.abs(e.x - p.x) < 22 && heightHit(e, p)) {
        e.hit = true;
        hurtPlayer(e.spec.dmg + 4, e.face, '飞车撞上来了');
      }
      if (e.t <= 0) {
        e.act = 'idle';
        e.t = e.think;
      }
      return;
    }

    const dist = hypot(dx, dy * 1.6);
    const slot = attackers() < (e.boss ? 3 : 2);
    const close = Math.abs(dx) < e.spec.range + 6 && Math.abs(dy) < 14;

    e.t -= dt;
    if (close && slot && e.t <= 0 && grounded(e)) {
      e.act = 'punch';
      e.t = e.spec.punchDur;
      e.hit = false;
      e.vx = e.face * 40;
      return;
    }
    if (e.spec.charge && slot && Math.abs(dy) < 12 && Math.abs(dx) > 90 && Math.abs(dx) < 220 && e.t <= 0 && grounded(e)) {
      e.act = 'charge';
      e.t = 0.42;
      e.hit = false;
      e.face = dx > 0 ? 1 : -1;
      return;
    }

    let tx = p.x - e.face * (close ? 36 : 26);
    let ty = p.y;
    if (!slot && Math.abs(dx) < 70) {
      ty = p.y + (e.id % 2 === 0 ? -28 : 28);
      tx = p.x - e.face * 80;
    }
    const ax = tx - e.x;
    const ay = ty - e.y;
    const spd = e.spec.spd * (G.kind === 'endless' ? 1 + Math.min(0.4, G.wave * 0.03) : 1);
    if (Math.abs(ax) > 4) e.x += Math.sign(ax) * spd * dt;
    if (Math.abs(ay) > 3) e.y += Math.sign(ay) * spd * 0.62 * dt;
    applyJump(e, dt);
    clampBelt(e);
    e.act = 'walk';
    if (e.t <= 0) e.t = e.think;
  }

  function tickKnives(dt) {
    let i, k, j, e;
    for (i = G.knives.length - 1; i >= 0; i--) {
      k = G.knives[i];
      k.life -= dt;
      k.x += k.vx * dt;
      if (k.life <= 0) {
        G.knives.splice(i, 1);
        continue;
      }
      if (k.from === 'player') {
        for (j = 0; j < G.enemies.length; j++) {
          e = G.enemies[j];
          if (e.dead) continue;
          if (Math.abs(e.x - k.x) < 16 && Math.abs(e.y - k.y) < 16 && Math.abs((e.h || 0) - k.h) < 24) {
            hurtEnemy(e, 22, 160, k.face, false);
            audio.hit(G.combo, false);
            burst(k.x, k.y - 10, 8, CYN, 140, 0.28);
            G.knives.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  function tickDrops(dt) {
    const p = G.player;
    let i, d;
    for (i = G.drops.length - 1; i >= 0; i--) {
      d = G.drops[i];
      d.bob += dt * 3;
      if (!p || G.mode !== 'play' || G.deadT > 0) continue;
      if (Math.abs(p.x - d.x) < 18 && Math.abs(p.y - d.y) < 16 && grounded(p)) {
        if (d.kind === 'food') {
          p.hp = Math.min(p.maxHp, p.hp + 32);
          G.hp = p.hp;
          audio.food();
          toast('烤鸡 +32', false, true);
          pop(p.x, p.y - 40, '+32', LEAF);
        } else if (d.kind === 'pipe') {
          setWep('pipe', 8);
          audio.pickup();
          toast('铁管', false, true);
        } else {
          setWep('knife', 3);
          audio.pickup();
          toast('飞刀', false, true);
        }
        pickupKick();
        flash(GOLD, 0.22);
        burst(d.x, d.y - 8, 10, GOLD, 120, 0.3);
        G.drops.splice(i, 1);
        G.hudDirty = true;
      }
    }
  }

  /* ---- stage / waves ---- */
  function livingEnemies() {
    let n = 0, i;
    for (i = 0; i < G.enemies.length; i++) if (!G.enemies[i].dead) n += 1;
    return n;
  }
  function pruneDead() {
    let i;
    for (i = G.enemies.length - 1; i >= 0; i--) {
      if (G.enemies[i].dead && G.enemies[i].deadT <= 0) {
        if (G.enemies[i] === G.boss) G.boss = null;
        G.enemies.splice(i, 1);
      }
    }
  }

  function spawnPack(pack, idx) {
    let i, f, e;
    pack.spawned = true;
    for (i = 0; i < pack.foes.length; i++) {
      f = pack.foes[i];
      e = makeFoe(f[0], f[1], f[2], 1);
      e.pack = idx;
      G.enemies.push(e);
    }
    G.arenaR = pack.gate;
    toast(idx === 0 ? '来了' : '又一波', false, false);
  }

  function spawnBoss(kind, x, scaleHp) {
    const e = makeFoe(kind, x, (BELT_TOP + BELT_BOT) * 0.5, scaleHp || 1);
    G.enemies.push(e);
    G.boss = e;
    G.arenaL = Math.max(0, x - 280);
    G.arenaR = Math.min(G.levelW, x + 220);
    toast(e.spec.name + ' 来了', true, false);
    audio.start();
    flash(HOT, 0.35);
    G.hudDirty = true;
    G.intro = 1.2;
  }

  function nextStreetGate() {
    let i, p;
    for (i = 0; i < G.packs.length; i++) {
      p = G.packs[i];
      if (!p.spawned) return p.x + 40;
      if (p.spawned && !p.cleared) return p.gate;
    }
    return G.levelW;
  }

  function tickStreet(dt) {
    const p = G.player;
    if (!p) return;
    let i, pack, any;
    for (i = 0; i < G.packs.length; i++) {
      pack = G.packs[i];
      if (!pack.spawned && p.x > pack.x - 180) spawnPack(pack, i);
      if (pack.spawned && !pack.cleared) {
        any = G.enemies.some(function (e) { return e.pack === i && !e.dead; });
        if (!any) {
          pack.cleared = true;
          G.arenaR = nextStreetGate();
        }
      }
    }
    const all = G.packs.every(function (pk) { return pk.cleared; });
    if (all && !G.boss && G.clearT <= 0) {
      const st = stageAt(G.stage - 1);
      if (!G._bossQueued) {
        G.arenaR = st.w;
        if (p.x > st.w - 460) {
          G._bossQueued = true;
          spawnBoss(st.bossKind, st.w - 200, 1);
        }
      }
    }
    if (G.boss && G.boss.dead && G.clearT <= 0) {
      G.clearT = 1.6;
      bumpScore(2000 * G.stage);
      toast(stageAt(G.stage - 1).name + ' 清了', false, true);
    }
    if (G.clearT > 0) {
      G.clearT -= dt;
      G.arenaR = G.levelW;
      if (G.clearT <= 0) finishStage();
    }
  }

  function finishStage() {
    if (G.kind !== 'street') return;
    if (G.stage >= 3) {
      bumpScore(8000);
      G.won = true;
      winKick();
      showOver(true);
      return;
    }
    G.stage += 1;
    const keepScore = G.score;
    const keepLives = G.lives;
    const keepHp = G.player ? G.player.hp : HP_MAX;
    const keepWep = G.wep;
    const keepAmmo = G.ammo;
    const keepCombo = G.combo;
    loadStreet(G.stage);
    G.score = keepScore;
    G.lives = keepLives;
    G.wep = keepWep;
    G.ammo = keepAmmo;
    G.combo = keepCombo;
    G.comboT = COMBO_WIN;
    if (G.player) {
      G.player.hp = keepHp;
      G.hp = keepHp;
    }
    G.invuln = 0.8;
    toast(stageAt(G.stage - 1).name, false, true);
    G.hudDirty = true;
    audio.start();
  }

  function tickEndless(dt) {
    if (G.waveWait > 0) {
      G.waveWait -= dt;
      if (G.waveWait <= 0) spawnWave();
      return;
    }
    if (livingEnemies() === 0 && !G.boss) {
      if (G.wave % 5 === 0 && G._waveBossJust) {
        G._waveBossJust = false;
      }
      bumpScore(400 * G.wave);
      G.wave += 1;
      G.waveWait = 1.15;
      G.arenaR = G.player.x + 420;
      G.arenaL = Math.max(0, G.player.x - 200);
      toast('第 ' + G.wave + ' 波', false, true);
      G.hudDirty = true;
    }
  }

  function spawnWave() {
    const n = 2 + Math.min(7, G.wave);
    const scaleHp = 1 + Math.min(1.4, (G.wave - 1) * 0.08);
    const px = G.player ? G.player.x : 120;
    let i, kind, x, y, e;
    G.arenaL = Math.max(0, px - 180);
    G.arenaR = px + 380;
    G.levelW = Math.max(G.levelW, G.arenaR + 200);
    if (G.wave % 5 === 0) {
      const kinds = ['iron', 'steel', 'black'];
      spawnBoss(kinds[(Math.floor(G.wave / 5) - 1) % 3], px + 180, scaleHp);
      G._waveBossJust = true;
      return;
    }
    for (i = 0; i < n; i++) {
      kind = (G.wave >= 3 && i % 3 === 2) ? 'biker' : 'punk';
      if (G.wave >= 6 && i % 4 === 1) kind = 'biker';
      x = px + 90 + i * 36 + rand(-10, 20);
      y = lerp(BELT_TOP + 8, BELT_BOT - 8, (i % 5) / 4);
      e = makeFoe(kind, x, y, scaleHp);
      G.enemies.push(e);
    }
    if (G.wave % 4 === 0) G.drops.push(makeDrop(px + 140, (BELT_TOP + BELT_BOT) * 0.5, Math.random() < 0.5 ? 'pipe' : 'knife'));
    if (G.wave % 3 === 0) G.drops.push(makeDrop(px + 80, BELT_BOT - 20, 'food'));
  }

  function tickCam(dt) {
    const p = G.player;
    if (!p) return;
    const lead = p.face * 70;
    const target = clamp(p.x - VW * 0.38 + lead, Math.max(0, G.arenaL - 40), Math.max(0, G.arenaR - VW + 40));
    const limR = Math.max(0, G.levelW - VW);
    const want = clamp(target, 0, limR);
    G.camX = lerp(G.camX, want, 1 - Math.pow(0.001, dt));
    if (Math.abs(G.camX - want) < 0.4) G.camX = want;
  }

  function tick(dt) {
    G.clock += dt;
    if (G.intro > 0) G.intro -= dt;
    if (G.invuln > 0) G.invuln -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    if (G.mode === 'title') {
      tickPlayer(dt, titleDemo());
      let i;
      for (i = 0; i < G.enemies.length; i++) tickEnemy(G.enemies[i], dt);
      tickKnives(dt);
      pruneDead();
      if (livingEnemies() < 2) {
        G.enemies.push(makeFoe(Math.random() < 0.4 ? 'biker' : 'punk', G.player.x + rand(180, 280), rand(BELT_TOP + 10, BELT_BOT - 10), 1));
      }
      G.arenaL = Math.max(0, G.player.x - 240);
      G.arenaR = G.player.x + 420;
      G.levelW = Math.max(G.levelW, G.arenaR + 80);
      tickCam(dt);
      return;
    }
    if (G.mode !== 'play') {
      if (G.player) {
        applyJump(G.player, dt);
        let j;
        for (j = 0; j < G.enemies.length; j++) {
          applyJump(G.enemies[j], dt);
          if (G.enemies[j].dead) G.enemies[j].deadT -= dt;
        }
      }
      return;
    }
    if (G.deadT > 0) {
      G.deadT -= dt;
      tickPlayer(dt, null);
      let k;
      for (k = 0; k < G.enemies.length; k++) tickEnemy(G.enemies[k], dt);
      if (G.deadT <= 0) respawn();
      tickCam(dt);
      return;
    }
    tickPlayer(dt, null);
    let i;
    for (i = 0; i < G.enemies.length; i++) tickEnemy(G.enemies[i], dt);
    tickKnives(dt);
    tickDrops(dt);
    pruneDead();
    if (G.kind === 'street') tickStreet(dt);
    else tickEndless(dt);
    tickCam(dt);
  }

  function titleDemo() {
    const p = G.player;
    if (!p) return { l: false, r: true, u: false, d: false, punch: false };
    let punch = false;
    let i, e;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (!e.dead && e.x - p.x < 48 && e.x - p.x > 8 && Math.abs(e.y - p.y) < 20) punch = true;
    }
    return { l: false, r: !punch, u: false, d: p.y < 250, punch: punch };
  }

  /* ---- setup ---- */
  function loadStreet(n) {
    const st = stageAt(n - 1);
    G.stage = n;
    G.theme = st.theme;
    G.levelW = st.w;
    G.packs = st.packs.map(function (p) {
      return { x: p.x, gate: p.gate, foes: p.foes, spawned: false, cleared: false };
    });
    G.enemies = [];
    G.drops = st.drops.map(function (d) { return makeDrop(d[0], d[1], d[2]); });
    G.knives = [];
    G.boss = null;
    G._bossQueued = false;
    G.clearT = 0;
    G.arenaL = 0;
    G.arenaR = st.packs[0].x + 40;
    G.player = makePlayer(70, (BELT_TOP + BELT_BOT) * 0.55);
    G.hp = HP_MAX;
    G.camX = 0;
    G.intro = 0.9;
    G.invuln = 0;
    G.deadT = 0;
    resetFx();
  }

  function loadEndless() {
    G.theme = 'street';
    G.levelW = 2400;
    G.wave = 1;
    G.packs = [];
    G.enemies = [];
    G.drops = [makeDrop(240, 270, 'pipe')];
    G.knives = [];
    G.boss = null;
    G.arenaL = 0;
    G.arenaR = 520;
    G.player = makePlayer(80, (BELT_TOP + BELT_BOT) * 0.55);
    G.hp = HP_MAX;
    G.camX = 0;
    G.waveWait = 0.4;
    G.intro = 0.7;
    G.invuln = 0;
    G.deadT = 0;
    resetFx();
  }

  function startRun(kind) {
    audio.start();
    G.mode = 'play';
    G.kind = kind === 'endless' ? 'endless' : 'street';
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.lives = LIVES;
    G.nextLife = LIFE_EVERY;
    G.won = false;
    G.why = '';
    setWep('fist', 0);
    setModes(G.kind);
    if (G.kind === 'endless') loadEndless();
    else loadStreet(1);
    hideOverlay();
    setHint(G.kind === 'endless' ? '一波接一波 · 每 5 波头目 · 血空丢命' : '沿街清场 · 关底头目 · 打穿夜楼');
    syncHud();
    try { canvas.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
  }

  function showTitle() {
    G.mode = 'title';
    G.kind = 'street';
    G.stage = 1;
    G.wave = 1;
    G.score = 0;
    G.combo = 0;
    G.lives = LIVES;
    setWep('fist', 0);
    setModes('street');
    G.theme = 'street';
    G.levelW = 1800;
    G.packs = [];
    G.enemies = [
      makeFoe('punk', 260, 260, 1),
      makeFoe('biker', 340, 300, 1)
    ];
    G.drops = [makeDrop(200, 280, 'pipe')];
    G.knives = [];
    G.boss = null;
    G.arenaL = 0;
    G.arenaR = 640;
    G.player = makePlayer(90, 270);
    G.hp = HP_MAX;
    G.camX = 0;
    G.invuln = 99;
    G.deadT = 0;
    resetFx();
    panel.className = 'panel';
    ovKicker.textContent = 'RAGE';
    ovTitle.textContent = '怒街';
    ovLead.innerHTML = '沿街清场，三连拳，C 爆发耗血。<br />捡铁管和飞刀，打穿街区。';
    ovOps.textContent = OPS;
    ovStart.classList.remove('gone');
    ovEnd.classList.add('gone');
    showOverlay();
    setHint('走跳拳 · C 爆发耗血 · 捡管刀 · 血空丢命');
    syncHud();
  }

  function showOver(win) {
    G.mode = 'over';
    G.won = win;
    persistBest();
    panel.className = 'panel ' + (win ? 'win' : 'lose');
    ovKicker.textContent = win ? 'CLEAR' : 'DOWN';
    if (win) ovTitle.textContent = G.kind === 'endless' ? '连战' : '夜楼清了';
    else ovTitle.textContent = G.why || '被打倒了';
    const extra = G.kind === 'endless'
      ? ('撑到第 ' + G.wave + ' 波 · ')
      : ('第 ' + G.stage + ' 街 · ');
    ovLead.textContent = extra + G.score + ' 分 · 连击最高 ×' + G.maxCombo + (G.score >= G.best && G.score > 0 ? ' · 新纪录' : '');
    ovOps.textContent = 'R 或「再来」重开 · 顶栏重开随时可用';
    ovStart.classList.add('gone');
    ovEnd.classList.remove('gone');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = win ? '无尽' : '换模式';
    showEndOverlay();
    if (win) audio.win(); else audio.over();
    setHint('R 再来 · 换模式回标题', win ? 'hot' : 'warn');
    try { ovAgain.focus(); } catch (e) { /* ignore */ }
    syncHud();
  }

  function retry() {
    audio.ui();
    hintEl.classList.remove('warn', 'hot');
    if (G.mode === 'title') startRun('street');
    else startRun(G.kind);
  }

  /* ---- draw ---- */
  function wx(x) {
    return ox + (x - G.camX) * scale;
  }
  function wy(y) {
    return oy + y * scale;
  }
  function rr(x, y, w, h, r) {
    const m = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + m, y);
    ctx.arcTo(x + w, y, x + w, y + h, m);
    ctx.arcTo(x + w, y + h, x, y + h, m);
    ctx.arcTo(x, y + h, x, y, m);
    ctx.arcTo(x, y, x + w, y, m);
    ctx.closePath();
  }

  function drawSky() {
    let g, theme = G.theme;
    if (theme === 'dock') {
      g = ctx.createLinearGradient(0, oy, 0, oy + 210 * scale);
      g.addColorStop(0, '#12080c');
      g.addColorStop(1, '#2a140c');
    } else if (theme === 'tower') {
      g = ctx.createLinearGradient(0, oy, 0, oy + 210 * scale);
      g.addColorStop(0, '#0a0608');
      g.addColorStop(1, '#1a0c10');
    } else {
      g = ctx.createLinearGradient(0, oy, 0, oy + 210 * scale);
      g.addColorStop(0, '#0a0410');
      g.addColorStop(1, '#1a0814');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
    ctx.fillStyle = rgba(GOLD, 0.18);
    ctx.beginPath();
    ctx.arc(wx(G.camX * 0.2 + 520), wy(48), 18 * scale, 0, TAU);
    ctx.fill();
  }

  function drawBuildings() {
    const start = Math.floor((G.camX * 0.35) / 70) - 1;
    let i, hsh, bx, bw, bh, wy0, win, c, neon;
    wy0 = 40;
    for (i = start; i < start + 16; i++) {
      hsh = hash2(i * 17 + (G.theme === 'dock' ? 3 : G.theme === 'tower' ? 9 : 1));
      bx = i * 70 - G.camX * 0.35;
      bw = 48 + hsh * 28;
      bh = 70 + hsh * 90;
      ctx.fillStyle = G.theme === 'tower' ? '#12080c' : '#100610';
      ctx.fillRect(wx(G.camX + bx), wy(210 - bh), bw * scale, bh * scale);
      for (win = 0; win < 8; win++) {
        if (hash2(i * 90 + win) < 0.55) {
          c = hash2(i + win * 3) < 0.33 ? GOLD : (hash2(i + win) < 0.5 ? CYN : MAG);
          ctx.fillStyle = rgba(c, 0.35 + 0.25 * Math.sin(G.clock * 2 + win));
          ctx.fillRect(
            wx(G.camX + bx + 6 + (win % 3) * 14),
            wy(210 - bh + 10 + Math.floor(win / 3) * 16),
            7 * scale, 8 * scale
          );
        }
      }
      if (hsh > 0.62) {
        neon = hsh > 0.8 ? HOT : CYN;
        ctx.fillStyle = rgba(neon, 0.55);
        ctx.fillRect(wx(G.camX + bx + 8), wy(210 - bh - 10), 22 * scale, 6 * scale);
      }
    }
    if (G.theme === 'dock') {
      ctx.fillStyle = 'rgba(20, 40, 60, 0.45)';
      ctx.fillRect(ox, wy(188), VW * scale, 28 * scale);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ox, wy(200 + Math.sin(G.clock * 1.4) * 2));
      ctx.lineTo(ox + VW * scale, wy(200 + Math.sin(G.clock * 1.4 + 1) * 2));
      ctx.stroke();
    }
  }

  function drawStreet() {
    const g = ctx.createLinearGradient(0, wy(BELT_TOP - 18), 0, wy(VH));
    g.addColorStop(0, G.theme === 'tower' ? '#1a1014' : '#181018');
    g.addColorStop(0.35, '#121016');
    g.addColorStop(1, '#0a060c');
    ctx.fillStyle = g;
    ctx.fillRect(ox, wy(BELT_TOP - 18), VW * scale, (VH - (BELT_TOP - 18)) * scale);

    ctx.fillStyle = G.theme === 'tower' ? '#3a1820' : '#2a1a14';
    ctx.fillRect(ox, wy(BELT_TOP - 18), VW * scale, 8 * scale);
    ctx.fillStyle = rgba(HOT, 0.18);
    ctx.fillRect(ox, wy(BELT_TOP - 12), VW * scale, 2 * scale);

    ctx.fillStyle = '#0c0810';
    ctx.fillRect(ox, wy(BELT_BOT + 6), VW * scale, 8 * scale);
    ctx.fillStyle = rgba(HOT, 0.28);
    ctx.fillRect(ox, wy(BELT_BOT + 4), VW * scale, 2 * scale);

    const x0 = Math.floor(G.camX / 80) * 80;
    let x;
    ctx.strokeStyle = 'rgba(255, 227, 107, 0.12)';
    ctx.lineWidth = 2 * scale;
    ctx.setLineDash([12 * scale, 16 * scale]);
    ctx.beginPath();
    ctx.moveTo(wx(x0 - 80), wy((BELT_TOP + BELT_BOT) * 0.5));
    ctx.lineTo(wx(x0 + VW + 80), wy((BELT_TOP + BELT_BOT) * 0.5));
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (x = x0; x < G.camX + VW + 40; x += 90) {
      ctx.beginPath();
      ctx.moveTo(wx(x), wy(BELT_TOP));
      ctx.lineTo(wx(x + 40), wy(BELT_BOT));
      ctx.stroke();
    }

    for (x = x0; x < G.camX + VW + 60; x += 160) {
      const lampX = x + 40;
      ctx.fillStyle = '#1a1014';
      ctx.fillRect(wx(lampX), wy(118), 4 * scale, (BELT_TOP - 118) * scale);
      ctx.fillStyle = rgba(GOLD, 0.12);
      ctx.beginPath();
      ctx.arc(wx(lampX + 2), wy(124), 22 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.55);
      ctx.beginPath();
      ctx.arc(wx(lampX + 2), wy(120), 5 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawDrop(d) {
    const x = wx(d.x);
    const y = wy(d.y - 6 - Math.sin(d.bob) * 3);
    const s = scale;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(wx(d.x), wy(d.y), 8 * s, 3 * s, 0, 0, TAU);
    ctx.fill();
    if (d.kind === 'pipe') {
      ctx.strokeStyle = rgba(PIPE_C, 1);
      ctx.lineWidth = 3.2 * s;
      ctx.beginPath();
      ctx.moveTo(x - 10 * s, y + 4 * s);
      ctx.lineTo(x + 12 * s, y - 6 * s);
      ctx.stroke();
    } else if (d.kind === 'knife') {
      ctx.fillStyle = rgba(KNIFE_C, 1);
      ctx.beginPath();
      ctx.moveTo(x + 10 * s, y - 2 * s);
      ctx.lineTo(x - 6 * s, y + 3 * s);
      ctx.lineTo(x - 8 * s, y - 1 * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.fillRect(x - 10 * s, y - 2 * s, 5 * s, 3 * s);
    } else {
      ctx.fillStyle = rgba(GOLD, 1);
      ctx.beginPath();
      ctx.ellipse(x, y, 7 * s, 5 * s, -0.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.85);
      ctx.fillRect(x + 2 * s, y - 7 * s, 2.2 * s, 6 * s);
    }
  }

  function drawKnife(k) {
    const x = wx(k.x);
    const y = wy(k.y - k.h);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(k.face, 1);
    ctx.fillStyle = rgba(KNIFE_C, 0.95);
    ctx.beginPath();
    ctx.moveTo(10 * scale, 0);
    ctx.lineTo(-6 * scale, 3 * scale);
    ctx.lineTo(-6 * scale, -3 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawFighter(e, look, opts) {
    const s = scale * look.size;
    const x = wx(e.x);
    const y = wy(e.y - e.h);
    const face = e.face || 1;
    const blink = opts && opts.blink && ((G.clock * 16) | 0) % 2 === 0;
    if (blink) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(face, 1);

    ctx.fillStyle = 'rgba(0,0,0,' + (0.35 + (e.h > 0 ? 0.08 : 0)) + ')';
    ctx.beginPath();
    ctx.ellipse(0, e.h * scale, 11 * s, 4 * s, 0, 0, TAU);
    ctx.fill();

    const walk = (e.act === 'walk' || e.act === 'charge') ? Math.sin(e.step * 2.2) : 0;
    const punch = e.act === 'punch' || e.act === 'jumpPunch' || e.act === 'throw';
    const spec = e.act === 'special';
    const hurt = e.act === 'hurt';
    const down = e.act === 'down';
    const jump = e.act === 'jump' || e.act === 'jumpPunch' || spec;
    let bodyY = -16 * s;
    if (down) {
      ctx.rotate(-1.15);
      bodyY = -8 * s;
    } else if (hurt) {
      ctx.rotate(-0.18);
    } else if (spec) {
      ctx.rotate(G.clock * 18);
    }

    if (e.flashT > 0) ctx.globalAlpha = 0.55 + 0.45 * Math.sin(G.clock * 40);

    ctx.fillStyle = rgba(look.pants, 1);
    if (!down) {
      ctx.fillRect(-6 * s + walk * 3 * s, -10 * s, 4.2 * s, jump ? 8 * s : 12 * s);
      ctx.fillRect(1.4 * s - walk * 3 * s, -10 * s, 4.2 * s, jump ? 8 * s : 12 * s);
    } else {
      ctx.fillRect(-10 * s, -6 * s, 14 * s, 5 * s);
    }
    ctx.fillStyle = '#d8dce8';
    if (!down) {
      ctx.fillRect(-6.2 * s + walk * 3 * s, jump ? -4 * s : 0, 4.4 * s, 3 * s);
      ctx.fillRect(1.2 * s - walk * 3 * s, jump ? -4 * s : 0, 4.4 * s, 3 * s);
    }

    ctx.fillStyle = rgba(look.jacket, 1);
    rr(-8 * s, bodyY - 2 * s, 16 * s, 14 * s, 3 * s);
    ctx.fill();
    ctx.fillStyle = rgba(look.accent, 0.7);
    ctx.fillRect(-2 * s, bodyY, 4 * s, 10 * s);

    const armY = bodyY + 2 * s;
    ctx.fillStyle = rgba(look.skin, 1);
    if (punch) {
      ctx.fillRect(6 * s, armY - 3 * s, 14 * s, 4.2 * s);
      ctx.fillRect(-10 * s, armY + 2 * s, 7 * s, 3.4 * s);
      if (opts && opts.pipe) {
        ctx.strokeStyle = rgba(PIPE_C, 1);
        ctx.lineWidth = 3 * s;
        ctx.beginPath();
        ctx.moveTo(16 * s, armY);
        ctx.lineTo(30 * s, armY - 8 * s);
        ctx.stroke();
      }
    } else if (spec) {
      ctx.fillRect(6 * s, armY - 6 * s, 12 * s, 3.6 * s);
      ctx.fillRect(-16 * s, armY + 2 * s, 12 * s, 3.6 * s);
    } else {
      ctx.fillRect(5 * s, armY + walk * 2 * s, 4 * s, 9 * s);
      ctx.fillRect(-9 * s, armY - walk * 2 * s, 4 * s, 9 * s);
    }

    ctx.fillStyle = rgba(look.skin, 1);
    ctx.beginPath();
    ctx.arc(0, bodyY - 8 * s, 6.2 * s, 0, TAU);
    ctx.fill();

    if (look.hairStyle === 'mohawk') {
      ctx.fillStyle = rgba(look.hair, 1);
      ctx.fillRect(-1.6 * s, bodyY - 18 * s, 3.2 * s, 10 * s);
    } else if (look.hairStyle === 'axel') {
      ctx.fillStyle = rgba(look.hair, 1);
      ctx.beginPath();
      ctx.ellipse(-1 * s, bodyY - 10 * s, 6.4 * s, 4.2 * s, -0.2, 0, TAU);
      ctx.fill();
    } else if (look.hairStyle === 'helm') {
      ctx.fillStyle = rgba(look.hair, 1);
      rr(-6.4 * s, bodyY - 14 * s, 12.8 * s, 8 * s, 3 * s);
      ctx.fill();
      ctx.fillStyle = rgba(look.accent, 0.9);
      ctx.fillRect(-6.4 * s, bodyY - 9 * s, 12.8 * s, 2 * s);
    } else if (look.hairStyle === 'slick') {
      ctx.fillStyle = rgba(look.hair, 1);
      ctx.beginPath();
      ctx.ellipse(0, bodyY - 10 * s, 6.4 * s, 3.4 * s, 0, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(look.hair, 0.8);
      ctx.beginPath();
      ctx.arc(0, bodyY - 10 * s, 5.4 * s, Math.PI, 0);
      ctx.fill();
    }

    ctx.fillStyle = '#1a1014';
    ctx.fillRect(1.4 * s, bodyY - 9 * s, 2.2 * s, 2.2 * s);

    if (e.boss) {
      ctx.strokeStyle = rgba(GOLD, 0.5);
      ctx.lineWidth = 1.2 * s;
      ctx.beginPath();
      ctx.arc(0, bodyY - 8 * s, 8 * s, 0, TAU);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawGhosts() {
    let i, g, a;
    for (i = 0; i < ghosts.length; i++) {
      g = ghosts[i];
      a = ctx.globalAlpha;
      ctx.globalAlpha = clamp(g.t / 0.22, 0, 1) * g.a;
      drawFighter(g, lookOf('player'), {});
      ctx.globalAlpha = a;
    }
  }

  function drawHpChip(e, look) {
    if (e.hp >= e.maxHp && !e.boss) return;
    const w = (e.boss ? 42 : 22) * scale;
    const x = wx(e.x) - w / 2;
    const y = wy(e.y - e.h - (e.boss ? 52 : 40) * (look.size || 1));
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, w, 4 * scale);
    ctx.fillStyle = rgba(e.hp / e.maxHp < 0.32 ? MAG : (e.boss ? GOLD : HOT), 0.9);
    ctx.fillRect(x, y, w * clamp(e.hp / e.maxHp, 0, 1), 4 * scale);
  }

  function drawFxWorld() {
    let i, p;
    for (i = 0; i < rings.length; i++) {
      p = rings[i];
      ctx.strokeStyle = rgba(p.rgb, clamp(p.t / 0.45, 0, 1));
      ctx.lineWidth = 2.4 * scale;
      ctx.beginPath();
      ctx.arc(wx(p.x), wy(p.y), (p.r + (0.45 - p.t) * 90) * scale, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.t / p.max, 0, 1));
      ctx.beginPath();
      ctx.arc(wx(p.x), wy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < sparks.length; i++) {
      p = sparks[i];
      ctx.strokeStyle = rgba(p.rgb, clamp(p.t / 0.28, 0, 1));
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.moveTo(wx(p.x), wy(p.y));
      ctx.lineTo(wx(p.x - p.vx * 0.04), wy(p.y - p.vy * 0.04));
      ctx.stroke();
    }
    ctx.font = '800 ' + (14 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    for (i = 0; i < floats.length; i++) {
      p = floats[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.t / p.life, 0, 1));
      ctx.fillText(p.text, wx(p.x), wy(p.y));
    }
  }

  function drawBossBar() {
    if (!G.boss || G.boss.dead) return;
    const e = G.boss;
    const w = 220 * scale;
    const x = ox + (VW * scale - w) / 2;
    const y = oy + 14 * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    rr(x - 4 * scale, y - 4 * scale, w + 8 * scale, 18 * scale, 6 * scale);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(x, y + 8 * scale, w, 5 * scale);
    ctx.fillStyle = rgba(e.hp / e.maxHp < 0.3 ? MAG : HOT, 0.95);
    ctx.fillRect(x, y + 8 * scale, w * clamp(e.hp / e.maxHp, 0, 1), 5 * scale);
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.font = '700 ' + (10 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(e.spec.name, x + w / 2, y + 7 * scale);
  }

  function drawIntro() {
    if (G.intro <= 0 || G.mode !== 'play') return;
    const t = clamp(G.intro / 0.9, 0, 1);
    const a = t > 0.3 ? 1 : t / 0.3;
    const name = G.kind === 'endless' ? ('第 ' + G.wave + ' 波') : stageAt(G.stage - 1).name;
    ctx.fillStyle = 'rgba(12,3,6,' + (0.55 * a) + ')';
    rr(ox + 190 * scale, oy + 118 * scale, 260 * scale, 52 * scale, 12 * scale);
    ctx.fill();
    ctx.strokeStyle = rgba(GOLD, 0.45 * a);
    ctx.lineWidth = 1.4 * scale;
    rr(ox + 190 * scale, oy + 118 * scale, 260 * scale, 52 * scale, 12 * scale);
    ctx.stroke();
    ctx.fillStyle = rgba(GOLD, 0.95 * a);
    ctx.font = '900 ' + (22 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(name, ox + 320 * scale, oy + 142 * scale);
    ctx.font = '700 ' + (11 * scale) + 'px sans-serif';
    ctx.fillStyle = rgba(CYN, 0.9 * a);
    ctx.fillText(G.kind === 'endless' ? '无尽' : (G.boss ? G.boss.spec.name : '清街'), ox + 320 * scale, oy + 158 * scale);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#070208';
    ctx.fillRect(0, 0, W, H);

    const shx = (G.shake ? (Math.random() - 0.5) * G.shake : 0) + G.kickX;
    const shy = (G.shake ? (Math.random() - 0.5) * G.shake * 0.55 : 0) + G.kickY;
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();
    ctx.translate(shx, shy);

    drawSky();
    drawBuildings();
    drawStreet();

    const list = [];
    let i;
    for (i = 0; i < G.drops.length; i++) list.push({ z: G.drops[i].y - 80, kind: 'drop', o: G.drops[i] });
    for (i = 0; i < G.knives.length; i++) list.push({ z: G.knives[i].y, kind: 'knife', o: G.knives[i] });
    for (i = 0; i < G.enemies.length; i++) list.push({ z: G.enemies[i].y, kind: 'foe', o: G.enemies[i] });
    if (G.player) list.push({ z: G.player.y, kind: 'ply', o: G.player });
    list.sort(function (a, b) { return a.z - b.z; });

    drawGhosts();
    for (i = 0; i < list.length; i++) {
      if (list[i].kind === 'drop') drawDrop(list[i].o);
      else if (list[i].kind === 'knife') drawKnife(list[i].o);
      else if (list[i].kind === 'foe') {
        drawFighter(list[i].o, lookOf(list[i].o.kind), { pipe: false, blink: false });
        drawHpChip(list[i].o, lookOf(list[i].o.kind));
      } else {
        drawFighter(list[i].o, lookOf('player'), {
          pipe: G.wep === 'pipe',
          blink: G.invuln > 0 && G.mode === 'play'
        });
        if (G.mode === 'play') drawHpChip(list[i].o, lookOf('player'));
      }
    }

    drawFxWorld();
    drawBossBar();
    drawIntro();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
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

  /* ---- input ---- */
  function consumeEdges() {
    punchEdge.down = keys.punch && !punchEdge.was;
    jumpEdge.down = keys.jump && !jumpEdge.was;
    specEdge.down = keys.spec && !specEdge.was;
    if (punchEdge.down && G.player) G.player.punchBuf = BUFFER;
    if (specEdge.down && G.player) G.player.specBuf = BUFFER;
    punchEdge.was = keys.punch;
    jumpEdge.was = keys.jump;
    specEdge.was = keys.spec;
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (code === 'KeyZ' || code === 'KeyK' || k === 'z' || k === 'Z' || k === 'k' || k === 'K') keys.punch = down;
    if (space || code === 'KeyX' || k === 'x' || k === 'X' || k === 'j' || k === 'J') keys.jump = down;
    if (code === 'KeyC' || k === 'c' || k === 'C' || code === 'ShiftLeft' || code === 'ShiftRight') keys.spec = down;

    if (down && (isMove || space || k === 'Enter' || code === 'KeyZ' || code === 'KeyC' || code === 'KeyX')) e.preventDefault();
    if (!down) return;

    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restartOrRetry();
      return;
    }
    if (overlayOpen()) {
      if (G.mode === 'title') {
        if (k === '1' || space || k === 'Enter') {
          keys.jump = false;
          startRun('street');
          return;
        }
        if (k === '2') { startRun('endless'); return; }
      }
      if (G.mode === 'over') {
        if (k === '1' || space || k === 'Enter') {
          keys.jump = false;
          startRun(G.kind);
          return;
        }
        if (k === '2') {
          if (G.won) startRun('endless');
          else showTitle();
          return;
        }
      }
      return;
    }
  }

  function restartOrRetry() {
    audio.ensure();
    retry();
  }

  function bindHold(el, setter) {
    if (!el) return;
    function down(ev) {
      ev.preventDefault();
      setter(true);
      el.classList.add('held');
      audio.ensure();
      try { el.setPointerCapture(ev.pointerId); } catch (err) { /* ignore */ }
    }
    function up(ev) {
      ev.preventDefault();
      setter(false);
      el.classList.remove('held');
    }
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', function () {
      setter(false);
      el.classList.remove('held');
    });
  }

  bindHold(document.getElementById('btn-left'), function (v) { keys.l = v; });
  bindHold(document.getElementById('btn-right'), function (v) { keys.r = v; });
  bindHold(document.getElementById('btn-up'), function (v) { keys.u = v; });
  bindHold(document.getElementById('btn-down'), function (v) { keys.d = v; });
  bindHold(document.getElementById('btn-punch'), function (v) { keys.punch = v; });
  bindHold(document.getElementById('btn-jump'), function (v) { keys.jump = v; });
  bindHold(document.getElementById('btn-spec'), function (v) { keys.spec = v; });

  canvas.addEventListener('pointerdown', function (ev) {
    audio.ensure();
    ev.preventDefault();
    if (overlayOpen()) return;
    keys.punch = true;
  });
  canvas.addEventListener('pointerup', function () { keys.punch = false; });
  canvas.addEventListener('pointercancel', function () { keys.punch = false; });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) {
    audio.ensure();
    onKey(e, true);
  });
  window.addEventListener('keyup', function (e) { onKey(e, false); });

  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnRetry.addEventListener('click', function () {
    audio.ensure();
    retry();
  });
  btnStreet.addEventListener('click', function () {
    audio.ensure();
    startRun('street');
  });
  btnEndless.addEventListener('click', function () {
    audio.ensure();
    startRun('endless');
  });
  modeStreet.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'title') { setModes('street'); G.kind = 'street'; return; }
    startRun('street');
  });
  modeEndless.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'title') { setModes('endless'); G.kind = 'endless'; return; }
    startRun('endless');
  });
  ovAgain.addEventListener('click', function () {
    audio.ensure();
    startRun(G.kind);
  });
  ovMenu.addEventListener('click', function () {
    audio.ensure();
    audio.ui();
    if (G.won) startRun('endless');
    else showTitle();
  });

  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) last = 0;
  });
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) {
    new ResizeObserver(resize).observe(stageEl);
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
    consumeEdges();
    if (G.stop > 0) {
      G.stop -= dt;
      tickFx(dt);
    } else {
      acc += dt;
      let n = 0;
      while (acc >= STEP && n < 5) {
        tick(STEP);
        acc -= STEP;
        n += 1;
      }
      if (acc > STEP * 4) acc = 0;
      tickFx(dt);
    }
    if (G.hudDirty) syncHud();
    draw();
  }

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (e) { /* ignore */ }
  loadBest();
  resize();
  showTitle();
  requestAnimationFrame(frame);
})();
