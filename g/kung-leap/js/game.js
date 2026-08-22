'use strict';

(function () {
  const VW = 640;
  const VH = 360;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const LIVES = 3;
  const HP_MAX = 8;
  const FLOORS = 5;
  const FLOOR_W = 1680;
  const GROUND = 292;
  const WALK = 132;
  const JUMP_V = 348;
  const GRAV = 1180;
  const MAX_FALL = 640;
  const COYOTE = 0.09;
  const BUFFER = 0.12;
  const INVULN = 0.95;
  const DIE_T = 0.82;
  const COMBO_WIN = 1.32;
  const LIFE_EVERY = 20000;
  const MASH_NEED = 9;
  const MASH_NEED_N = 12;
  const BEST_KEY = 'playbox-kung-leap-best';
  const MUTE_KEY = 'playbox-kung-leap-mute';
  const OPS = '方向键 / WASD 走跳 · Z 拳 · X 踢 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 74, 26];
  const HOT2 = [255, 122, 72];
  const WHT = [246, 241, 238];
  const LEAF = [61, 255, 122];
  const SKIN = [232, 176, 144];
  const GI = [244, 240, 232];

  const ATK = {
    punch: { dur: 0.17, hit0: 0.03, hit1: 0.12, range: 38, y0: 16, y1: 34, stop: 0.046, kb: 240, score: 100, name: '拳' },
    kick: { dur: 0.22, hit0: 0.04, hit1: 0.16, range: 50, y0: 0, y1: 20, stop: 0.056, kb: 280, score: 200, name: '踢' },
    jkick: { dur: 0.28, hit0: 0.03, hit1: 0.22, range: 46, y0: -8, y1: 30, stop: 0.062, kb: 320, score: 300, name: '跳踢' },
    jpunch: { dur: 0.2, hit0: 0.03, hit1: 0.14, range: 36, y0: 14, y1: 36, stop: 0.048, kb: 220, score: 120, name: '跳拳' }
  };

  const FLOOR_META = [
    { name: '一层 · 山门', short: '一层', knife: 0.7, tumble: 0.3, grab: 0 },
    { name: '二层 · 回廊', short: '二层', knife: 0.5, tumble: 0.45, grab: 0.05 },
    { name: '三层 · 禅堂', short: '三层', knife: 0.35, tumble: 0.35, grab: 0.3 },
    { name: '四层 · 夜阁', short: '四层', knife: 0.3, tumble: 0.3, grab: 0.4 },
    { name: '顶层 · 魔殿', short: '顶层', knife: 0.4, tumble: 0.3, grab: 0.3 }
  ];

  const REDUCE = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
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
  function comboMul(n) {
    return 1 + Math.min(5, Math.max(0, (n | 0) - 1)) * 0.35;
  }
  function nightOn() {
    return G.kind === 'night';
  }
  function floorMeta() {
    return FLOOR_META[clamp((G.floor | 0) - 1, 0, 4)];
  }
  function spdMul() {
    return nightOn() ? 1.28 : 1;
  }
  function mashNeed() {
    return nightOn() ? MASH_NEED_N : MASH_NEED;
  }

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const stageEl = document.getElementById('stage');
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const ovStart = document.getElementById('ov-start');
  const ovEnd = document.getElementById('ov-end');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const comboEl = document.getElementById('combo');
  const scoreBox = document.getElementById('score-box');
  const comboBox = document.getElementById('combo-box');
  const scoreAdd = document.getElementById('score-add');
  const floorLabel = document.getElementById('floor-label');
  const modeLabel = document.getElementById('mode-label');
  const energyEl = document.getElementById('energy');
  const pipsEl = document.getElementById('pips');
  const hintEl = document.getElementById('hint');
  const toastEl = document.getElementById('toast');
  const chainPop = document.getElementById('chain-pop');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const modeFive = document.getElementById('mode-five');
  const modeNight = document.getElementById('mode-night');
  const btnFive = document.getElementById('btn-five');
  const btnNight = document.getElementById('btn-night');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');

  let W = VW;
  let H = VH;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let kickTok = 0;
  let toastTok = 0;
  let chainTok = 0;
  let addTok = 0;
  let atkSeq = 1;

  const keys = { l: false, r: false, u: false, d: false, punch: false, kick: false, jump: false, jumpSpace: false };
  const punchEdge = { was: false, down: false };
  const kickEdge = { was: false, down: false };
  const jumpEdge = { was: false, down: false };

  const particles = [];
  const sparks = [];
  const floats = [];
  const rings = [];
  const slashes = [];

  const G = {
    mode: 'title',
    kind: 'five',
    floor: 1,
    score: 0,
    best: 0,
    bestF: 0,
    bestN: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    lives: LIVES,
    hp: HP_MAX,
    nextLife: LIFE_EVERY,
    clock: 0,
    camX: 0,
    stop: 0,
    shake: 0,
    kickX: 0,
    kickY: 0,
    flash: 0,
    flashRgb: HOT,
    intro: 0,
    invuln: 0,
    deadT: 0,
    climb: 0,
    hurtT: 0,
    arena: false,
    spawnCd: 0,
    clearT: 0,
    why: '',
    won: false,
    hudDirty: true,
    player: null,
    enemies: [],
    knives: [],
    boss: null,
    grab: null
  };

  function overlayOpen() {
    return overlay && !overlay.classList.contains('hidden');
  }
  function inputOk() {
    return G.mode === 'play' && !overlayOpen() && G.deadT <= 0 && G.climb <= 0;
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
        this.master.gain.value = this.muted ? 0 : 0.42;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.42;
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
    punch: function () {
      this.ensure();
      this.noise(0.06, 0.07, 1400, 'highpass');
      this.beep(210, 0.05, 'sawtooth', 0.03, 80);
    },
    kick: function () {
      this.ensure();
      this.noise(0.08, 0.08, 700, 'bandpass');
      this.beep(140, 0.07, 'sawtooth', 0.04, 60);
    },
    hit: function (combo, heavy) {
      this.ensure();
      const p = 1 + Math.min(7, combo) * 0.07;
      this.noise(0.12, heavy ? 0.22 : 0.15, 210, 'lowpass');
      this.beep(170 * p, 0.1, 'square', 0.085, 58);
      this.beep((heavy ? 920 : 680) * p, 0.07, 'triangle', 0.05, 400 * p);
      if (heavy) this.beep(1240 * p, 0.09, 'square', 0.04, 1600 * p);
    },
    throw: function () {
      this.ensure();
      this.noise(0.14, 0.16, 320, 'lowpass');
      this.beep(240, 0.12, 'sawtooth', 0.06, 70);
      this.beep(720, 0.1, 'triangle', 0.04, 220);
    },
    knife: function () {
      this.ensure();
      this.noise(0.07, 0.07, 1900, 'highpass');
      this.beep(880, 0.06, 'square', 0.035, 420);
    },
    swat: function () {
      this.ensure();
      this.beep(980, 0.05, 'triangle', 0.04, 1400);
      this.noise(0.05, 0.06, 1600, 'highpass');
    },
    grab: function () {
      this.ensure();
      this.noise(0.12, 0.12, 180, 'lowpass');
      this.beep(160, 0.12, 'sawtooth', 0.05, 70);
    },
    mash: function () {
      this.ensure();
      this.beep(320 + Math.random() * 80, 0.04, 'square', 0.035, 180);
    },
    escape: function () {
      this.ensure();
      this.noise(0.16, 0.18, 240, 'lowpass');
      this.beep(220, 0.14, 'sawtooth', 0.07, 80);
      this.beep(640, 0.1, 'square', 0.05, 1100);
    },
    jump: function () {
      this.ensure();
      this.beep(380, 0.07, 'square', 0.03, 190);
    },
    land: function () {
      this.ensure();
      this.noise(0.05, 0.05, 280, 'lowpass');
    },
    hurt: function () {
      this.ensure();
      this.noise(0.16, 0.15, 240, 'lowpass');
      this.beep(280, 0.16, 'sawtooth', 0.05, 70);
    },
    ko: function () {
      this.ensure();
      this.noise(0.24, 0.18, 140, 'lowpass');
      this.beep(110, 0.28, 'sine', 0.07, 46);
    },
    stairs: function () {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.045, 523);
      this.beep(523, 0.1, 'triangle', 0.04, 784);
    },
    bossHit: function () {
      this.ensure();
      this.noise(0.16, 0.2, 160, 'lowpass');
      this.beep(140, 0.14, 'square', 0.07, 50);
      this.beep(880, 0.1, 'triangle', 0.05, 1400);
    },
    win: function () {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.05, 659);
      this.beep(659, 0.1, 'square', 0.05, 784);
      this.beep(1046, 0.2, 'triangle', 0.045, 1318);
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
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      const o = JSON.parse(raw);
      if (o && typeof o === 'object') {
        G.bestF = o.f | 0;
        G.bestN = o.n | 0;
      } else {
        const n = parseInt(raw, 10);
        if (n > 0) G.bestF = n;
      }
    } catch (e) { /* ignore */ }
    G.best = G.kind === 'night' ? G.bestN : G.bestF;
  }
  function persistBest() {
    if (G.kind === 'night') {
      if (G.score > G.bestN) G.bestN = G.score;
      G.best = G.bestN;
    } else {
      if (G.score > G.bestF) G.bestF = G.score;
      G.best = G.bestF;
    }
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({ f: G.bestF, n: G.bestN }));
    } catch (e) { /* ignore */ }
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
  function screenKick(cls, ms) {
    if (REDUCE || !stageEl) return;
    stageEl.classList.remove(cls);
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
    clearTimeout(kickTok);
    kickTok = setTimeout(function () { stageEl.classList.remove(cls); }, ms);
  }
  function flash(rgb, t) {
    G.flashRgb = rgb || HOT;
    G.flash = Math.max(G.flash, t || 0.12);
  }
  function burst(x, y, n, rgb, spd, life, g) {
    let i;
    for (i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const s = rand(spd * 0.35, spd);
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - rand(20, 90),
        life: life, max: life,
        r: rand(1.4, 3.4),
        rgb: rgb,
        g: g == null ? 520 : g
      });
    }
    capArr(particles, 180);
  }
  function spark(x, y, face, rgb) {
    sparks.push({
      x: x, y: y,
      vx: face * rand(80, 180),
      vy: rand(-120, -20),
      life: rand(0.12, 0.22),
      max: 0.22,
      rgb: rgb || GOLD
    });
    capArr(sparks, 60);
  }
  function ring(x, y, rgb) {
    rings.push({ x: x, y: y, r: 6, life: 0.28, max: 0.28, rgb: rgb || CYN });
    capArr(rings, 24);
  }
  function slashFx(x, y, face, kind) {
    slashes.push({ x: x, y: y, face: face, kind: kind, life: 0.14, max: 0.14 });
    capArr(slashes, 12);
  }
  function floatTxt(x, y, text, rgb) {
    floats.push({ x: x, y: y, text: text, life: 0.7, max: 0.7, rgb: rgb || GOLD });
    capArr(floats, 20);
  }
  function dust(x, y, n) {
    burst(x, y, n || 4, [180, 140, 110], 40, 0.28, 180);
  }
  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    clearTimeout(toastTok);
    toastTok = setTimeout(function () { toastEl.classList.add('hidden'); }, 1400);
  }
  function popChain(n) {
    if (!chainPop) return;
    chainPop.textContent = '×' + n;
    chainPop.classList.add('hidden');
    void chainPop.offsetWidth;
    chainPop.classList.remove('hidden');
    clearTimeout(chainTok);
    chainTok = setTimeout(function () { chainPop.classList.add('hidden'); }, 700);
  }
  function tickFx(dt) {
    G.kickX *= 0.82;
    G.kickY *= 0.82;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash -= dt;
    let i, p;
    for (i = particles.length - 1; i >= 0; i--) {
      p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      p = sparks[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) sparks.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      p = rings[i];
      p.life -= dt;
      p.r += dt * 90;
      if (p.life <= 0) rings.splice(i, 1);
    }
    for (i = slashes.length - 1; i >= 0; i--) {
      p = slashes[i];
      p.life -= dt;
      if (p.life <= 0) slashes.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      p = floats[i];
      p.life -= dt;
      p.y -= 42 * dt;
      if (p.life <= 0) floats.splice(i, 1);
    }
  }
  function resetFx() {
    particles.length = 0;
    sparks.length = 0;
    floats.length = 0;
    rings.length = 0;
    slashes.length = 0;
    G.stop = 0;
    G.shake = 0;
    G.kickX = 0;
    G.kickY = 0;
    G.flash = 0;
  }

  /* ---- entities ---- */
  function makePlayer(x) {
    return {
      x: x, y: GROUND, vx: 0, vy: 0, face: 1,
      w: 16, h: 32,
      grounded: true, coyote: 0, jumpBuf: 0,
      punchBuf: 0, kickBuf: 0,
      atk: null,
      walk: 0,
      grabT: 0
    };
  }
  function makeFoe(kind, x, face) {
    const e = {
      kind: kind,
      x: x, y: GROUND, vx: 0, vy: 0, face: face || 1,
      w: 16, h: 30,
      hp: 1,
      state: 'walk',
      t: rand(0.1, 0.4),
      cd: rand(0.2, 0.8),
      dead: false,
      deadT: 0,
      flash: 0,
      spin: 0,
      lastHit: 0,
      mash: 0
    };
    if (kind === 'tumble') {
      e.w = 22; e.h = 14; e.state = 'roll'; e.y = GROUND;
    }
    if (kind === 'grab') {
      e.w = 18; e.h = 28; e.state = 'run';
    }
    if (kind === 'boss') {
      e.w = 22; e.h = 42; e.hp = nightOn() ? 10 : 8; e.state = 'idle';
      e.t = 0.4;
    }
    if (kind === 'knife') e.cd = rand(0.4, 1.1);
    return e;
  }
  function makeKnife(x, y, face) {
    return { x: x, y: y, vx: face * (nightOn() ? 270 : 220), face: face, w: 18, h: 5, dead: false };
  }

  function livingEnemies() {
    let n = 0, i;
    for (i = 0; i < G.enemies.length; i++) if (!G.enemies[i].dead) n++;
    return n;
  }
  function maxFoes() {
    const base = [4, 5, 5, 6, 5][clamp(G.floor - 1, 0, 4)];
    return nightOn() ? base + 2 : base;
  }
  function spawnInterval() {
    const base = [1.35, 1.15, 1.0, 0.88, 1.05][clamp(G.floor - 1, 0, 4)];
    return (nightOn() ? base * 0.68 : base) / (1 + (G.floor - 1) * 0.04);
  }
  function pickKind() {
    const m = floorMeta();
    let k = m.knife, t = m.tumble, g = m.grab;
    if (nightOn()) {
      g = Math.min(0.62, g + 0.22);
      const rest = 1 - g;
      const s = k + t;
      k = s > 0 ? k / s * rest : rest * 0.5;
      t = rest - k;
    }
    const r = Math.random();
    if (r < g) return 'grab';
    if (r < g + t) return 'tumble';
    return 'knife';
  }
  function spawnFoe(kind, side) {
    const left = G.camX - 36;
    const right = G.camX + VW + 36;
    const x = side < 0 ? left : right;
    const face = side < 0 ? 1 : -1;
    const e = makeFoe(kind || pickKind(), x, face);
    if (e.kind === 'tumble') e.vx = face * (150 * spdMul());
    G.enemies.push(e);
    return e;
  }

  /* ---- score / hud ---- */
  function addScore(n, x, y, label) {
    if (G.mode !== 'play' || n <= 0) return;
    const mul = comboMul(G.combo);
    const got = Math.round(n * mul);
    G.score += got;
    if (G.score >= G.nextLife) {
      G.nextLife += LIFE_EVERY;
      G.lives = Math.min(6, G.lives + 1);
      audio.oneup();
      toast('1UP', false, true);
    }
    persistBest();
    G.hudDirty = true;
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    if (scoreAdd) {
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + got;
      clearTimeout(addTok);
      addTok = setTimeout(function () { scoreAdd.hidden = true; }, 700);
    }
    if (x != null) floatTxt(x, y - 28, (label ? label + ' ' : '') + '+' + got, GOLD);
  }
  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    G.hudDirty = true;
    if (comboBox) {
      comboBox.classList.remove('hot');
      void comboBox.offsetWidth;
      comboBox.classList.add('hot');
    }
    if (G.combo >= 2) {
      audio.combo(G.combo);
      if (G.combo === 3 || G.combo === 5 || G.combo === 8 || G.combo % 10 === 0) popChain(G.combo);
    }
  }
  function breakCombo() {
    G.combo = 0;
    G.comboT = 0;
    G.hudDirty = true;
  }
  function setModes(kind) {
    G.kind = kind === 'night' ? 'night' : 'five';
    if (modeFive) modeFive.setAttribute('aria-pressed', G.kind === 'five' ? 'true' : 'false');
    if (modeNight) modeNight.setAttribute('aria-pressed', G.kind === 'night' ? 'true' : 'false');
    G.best = G.kind === 'night' ? G.bestN : G.bestF;
    G.hudDirty = true;
  }
  function setHint(t, cls) {
    if (!hintEl) return;
    hintEl.textContent = t;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }
  function renderEnergy() {
    if (!energyEl) return;
    let html = '';
    let i;
    const low = G.hp <= 2;
    for (i = 0; i < HP_MAX; i++) {
      html += '<i class="epip' + (i < G.hp ? (low ? ' on warn' : ' on') : '') + '"></i>';
    }
    energyEl.innerHTML = html;
  }
  function renderPips() {
    if (!pipsEl) return;
    let html = '';
    let i;
    const cap = Math.max(LIVES, G.lives);
    for (i = 0; i < cap; i++) {
      html += '<i class="pip' + (i < G.lives ? ' on' : ' gone') + '"></i>';
    }
    pipsEl.innerHTML = html;
  }
  function syncHud() {
    G.hudDirty = false;
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (comboEl) comboEl.textContent = '×' + Math.max(1, G.combo);
    const meta = floorMeta();
    if (floorLabel) {
      floorLabel.textContent = meta.short;
      floorLabel.classList.toggle('hot', G.floor === 5);
    }
    if (modeLabel) {
      modeLabel.textContent = nightOn() ? '夜袭' : '五层';
      modeLabel.classList.toggle('night', nightOn());
    }
    renderEnergy();
    renderPips();
  }

  /* ---- combat ---- */
  function atkBox(p) {
    if (!p || !p.atk) return null;
    const a = ATK[p.atk.kind];
    if (!a) return null;
    const t = p.atk.t;
    if (t < a.hit0 || t > a.hit1) return null;
    const x0 = p.face > 0 ? p.x + 4 : p.x - 4 - a.range;
    const x1 = p.face > 0 ? p.x + 4 + a.range : p.x - 4;
    const y1 = p.y - a.y0;
    const y0 = p.y - a.y1;
    return { x0: x0, x1: x1, y0: y0, y1: y1, a: a };
  }
  function overlap(ax0, ax1, ay0, ay1, bx0, bx1, by0, by1) {
    return ax0 < bx1 && ax1 > bx0 && ay0 < by1 && ay1 > by0;
  }
  function foeBox(e) {
    const h = e.kind === 'tumble' && e.state === 'roll' ? 14 : e.h;
    return { x0: e.x - e.w * 0.5, x1: e.x + e.w * 0.5, y0: e.y - h, y1: e.y };
  }
  function startAttack(kind) {
    const p = G.player;
    if (!p || p.atk) return;
    if (G.grab) return;
    if (!p.grounded && kind === 'kick') kind = 'jkick';
    if (!p.grounded && kind === 'punch') kind = 'jpunch';
    const a = ATK[kind];
    if (!a) return;
    p.atk = { kind: kind, t: 0, id: ++atkSeq };
    if (kind === 'kick' || kind === 'jkick') audio.kick();
    else audio.punch();
    slashFx(p.x + p.face * 22, p.y - (kind === 'kick' || kind === 'jkick' ? 12 : 20), p.face, kind);
  }
  function throwFoe(e, face, heavy) {
    e.dead = true;
    e.state = 'dead';
    e.deadT = 0.7;
    e.vx = face * (heavy ? 340 : 260);
    e.vy = heavy ? -280 : -210;
    e.spin = face * rand(8, 14);
    e.y = Math.min(e.y, GROUND);
    const col = e.kind === 'grab' ? MAG : e.kind === 'tumble' ? LEAF : e.kind === 'boss' ? GOLD : HOT2;
    burst(e.x, e.y - e.h * 0.5, heavy ? 16 : 10, col, heavy ? 220 : 160, 0.4, 480);
    ring(e.x, e.y - 16, col);
    audio.throw();
  }
  function killFoe(e, atkKind, face) {
    if (e.dead) return;
    const a = ATK[atkKind] || ATK.punch;
    const heavy = atkKind === 'jkick' || atkKind === 'kick';
    if (e.kind === 'boss') {
      e.hp -= 1;
      e.flash = 0.16;
      e.vx = face * 80;
      e.state = 'hurt';
      e.t = 0.22;
      audio.bossHit();
      hitStop(0.07);
      shake(7);
      flash(GOLD, 0.14);
      burst(e.x, e.y - 22, 12, GOLD, 180, 0.36, 400);
      screenKick('thump', 160);
      addScore(a.score + 300, e.x, e.y, '赤尊');
      bumpCombo();
      if (e.hp <= 0) {
        throwFoe(e, face, true);
        flash(GOLD, 0.28);
        screenKick('boom', 180);
        addScore(5000, e.x, e.y - 10, '击败');
        G.clearT = 0.01;
        toast('赤尊倒下', false, true);
      }
      return;
    }
    throwFoe(e, face, heavy);
    hitStop(a.stop);
    shake(heavy ? 6 : 4);
    G.kickX = -face * (heavy ? 5 : 3);
    screenKick(heavy ? 'boom' : 'hit', 160);
    audio.hit(G.combo, heavy);
    bumpCombo();
    addScore(a.score, e.x, e.y, a.name);
    if (G.grab === e) G.grab = null;
  }
  function hurt(n, why, srcX) {
    if (G.mode !== 'play') return;
    if (G.invuln > 0 || G.deadT > 0 || G.climb > 0) return;
    const p = G.player;
    G.hp -= n;
    if (G.hp < 0) G.hp = 0;
    G.hudDirty = true;
    G.hurtT = 0.28;
    audio.hurt();
    hitStop(0.055);
    shake(6);
    flash(MAG, 0.12);
    screenKick('die', 280);
    burst(p.x, p.y - 18, 10, MAG, 140, 0.32, 420);
    if (srcX != null && p) p.vx = srcX < p.x ? 140 : -140;
    G.why = why || '被打倒了';
    if (G.hp <= 0) die(why);
    else G.invuln = INVULN;
  }
  function die(why) {
    G.lives -= 1;
    G.hp = 0;
    G.deadT = DIE_T;
    G.why = why || '体力空了';
    G.hudDirty = true;
    if (G.grab) {
      G.grab.state = 'walk';
      G.grab = null;
    }
    const p = G.player;
    if (p) {
      p.atk = null;
      p.vy = -160;
      p.vx *= 0.4;
    }
    audio.ko();
    shake(8);
    flash(MAG, 0.2);
    breakCombo();
  }
  function respawn() {
    if (G.lives <= 0) {
      showOver(false);
      return;
    }
    G.hp = HP_MAX;
    G.invuln = 1.25;
    G.deadT = 0;
    G.hurtT = 0;
    G.grab = null;
    const p = G.player;
    if (p) {
      p.y = GROUND;
      p.vy = 0;
      p.vx = 0;
      p.atk = null;
      p.grounded = true;
    }
    G.hudDirty = true;
    toast('再起', false, true);
  }

  function beginGrab(e) {
    if (G.grab || G.invuln > 0 || G.deadT > 0) return;
    G.grab = e;
    e.state = 'hold';
    e.t = 0;
    e.mash = 0;
    G.player.atk = null;
    G.player.vx = 0;
    audio.grab();
    shake(4);
    flash(MAG, 0.08);
    toast('连打挣脱！', true, false);
    setHint('连打 Z / X 挣脱擒拿', 'warn');
    hurt(1, '被擒住了', e.x);
  }
  function tickGrab(dt) {
    const e = G.grab;
    const p = G.player;
    if (!e || !p) return;
    e.x = p.x + (e.x < p.x ? -12 : 12);
    e.y = GROUND;
    p.x += Math.sin(G.clock * 28) * 0.35;
    e.t += dt;
    if (e.mash > 0) e.mash = Math.max(0, e.mash - dt * 0.85);
    if (e.t > 0.65) {
      e.t = 0;
      G.invuln = 0;
      hurt(1, '被勒住了', e.x);
      G.invuln = 0.05;
    }
    if (e.mash >= mashNeed()) {
      const face = p.face;
      audio.escape();
      throwFoe(e, face, true);
      hitStop(0.07);
      shake(7);
      G.kickX = -face * 6;
      screenKick('boom', 180);
      bumpCombo();
      addScore(250, e.x, e.y, '摔');
      G.grab = null;
      G.invuln = 0.45;
      setHint(nightOn() ? '夜袭更快 · 擒拿更多 · 踢翻滚' : '一击必杀 · 拳短踢长 · 擒拿连打挣脱');
      toast('挣脱！', false, true);
    }
  }

  /* ---- player ---- */
  function applyPhys(p, dt, lockX) {
    p.vy += GRAV * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    if (!lockX) p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.y >= GROUND) {
      if (!p.grounded && p.vy > 80) {
        dust(p.x, GROUND, 5);
        if (G.mode === 'play') audio.land();
        screenKick('thump', 140);
      }
      p.y = GROUND;
      p.vy = 0;
      p.grounded = true;
    } else {
      p.grounded = false;
    }
    p.x = clamp(p.x, G.arena ? Math.max(22, FLOOR_W - VW + 36) : 22, FLOOR_W - 22);
  }
  function tickPlayer(dt, demo) {
    const p = G.player;
    if (!p) return;
    const inPlay = G.mode === 'play' && !demo;
    const left = demo ? demo.l : (inPlay && inputOk() ? keys.l : false);
    const right = demo ? demo.r : (inPlay && inputOk() ? keys.r : false);
    const wantJump = demo ? demo.jump : false;

    if (G.deadT > 0) {
      applyPhys(p, dt, false);
      p.atk = null;
      return;
    }
    if (G.grab) {
      p.vx = 0;
      p.vy = 0;
      p.y = GROUND;
      p.grounded = true;
      p.atk = null;
      tickGrab(dt);
      return;
    }
    if (G.climb > 0) {
      p.vx = 0;
      p.x += 40 * dt;
      p.y -= 110 * dt;
      return;
    }

    if (p.punchBuf > 0) p.punchBuf -= dt;
    if (p.kickBuf > 0) p.kickBuf -= dt;
    if (p.jumpBuf > 0) p.jumpBuf -= dt;
    if (p.coyote > 0) p.coyote -= dt;
    if (p.grounded) p.coyote = COYOTE;

    const canAtk = !p.atk && (inPlay ? inputOk() : !!demo);
    if (canAtk) {
      if ((p.kickBuf > 0) || (demo && demo.kick)) {
        startAttack('kick');
        p.kickBuf = 0;
      } else if ((p.punchBuf > 0) || (demo && demo.punch)) {
        startAttack('punch');
        p.punchBuf = 0;
      }
    }

    if (p.atk) {
      p.atk.t += dt;
      const a = ATK[p.atk.kind];
      if (p.grounded) p.vx *= 0.55;
      const box = atkBox(p);
      if (box) resolveHits(p, box);
      if (p.atk.t >= a.dur) p.atk = null;
    } else {
      let ax = 0;
      if (left) ax -= 1;
      if (right) ax += 1;
      if (ax !== 0) p.face = ax > 0 ? 1 : -1;
      p.vx = ax * WALK;
      if (ax) p.walk += dt * 8;
      else p.walk = 0;
    }

    const jumpPress = wantJump || (inPlay && inputOk() && (p.jumpBuf > 0 || jumpEdge.down));
    if (jumpPress && (p.grounded || p.coyote > 0) && !p.atk) {
      p.vy = -JUMP_V;
      p.grounded = false;
      p.coyote = 0;
      p.jumpBuf = 0;
      audio.jump();
      dust(p.x, GROUND, 4);
      hitStop(0.028);
    }

    applyPhys(p, dt, false);
    resolveAttackKnives(p);
  }
  function resolveHits(p, box) {
    let i, e, fb;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (e.dead || e.lastHit === p.atk.id) continue;
      fb = foeBox(e);
      if (overlap(box.x0, box.x1, box.y0, box.y1, fb.x0, fb.x1, fb.y0, fb.y1)) {
        e.lastHit = p.atk.id;
        killFoe(e, p.atk.kind, p.face);
      }
    }
    if (G.boss && !G.boss.dead && G.boss.lastHit !== p.atk.id) {
      fb = foeBox(G.boss);
      if (overlap(box.x0, box.x1, box.y0, box.y1, fb.x0, fb.x1, fb.y0, fb.y1)) {
        G.boss.lastHit = p.atk.id;
        killFoe(G.boss, p.atk.kind, p.face);
      }
    }
  }
  function resolveAttackKnives(p) {
    const box = atkBox(p);
    if (!box) return;
    let i, k;
    for (i = 0; i < G.knives.length; i++) {
      k = G.knives[i];
      if (k.dead) continue;
      if (overlap(box.x0, box.x1, box.y0, box.y1, k.x - 8, k.x + 8, k.y - 4, k.y + 4)) {
        k.dead = true;
        burst(k.x, k.y, 6, CYN, 120, 0.24, 80);
        audio.swat();
        addScore(50, k.x, k.y, '挡');
        hitStop(0.03);
      }
    }
  }

  /* ---- enemies ---- */
  function tickEnemy(e, dt) {
    if (e.flash > 0) e.flash -= dt;
    if (e.dead) {
      e.deadT -= dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.vy += GRAV * dt;
      e.spin += dt * 10;
      return;
    }
    if (G.grab === e) return;
    const p = G.player;
    const sm = spdMul();
    const dx = p ? p.x - e.x : 0;

    if (e.kind === 'tumble') {
      e.state = 'roll';
      if (Math.abs(e.vx) < 20) e.vx = e.face * 150 * sm;
      e.x += e.vx * dt;
      e.spin += dt * e.vx * 0.12;
      e.y = GROUND;
      if (p && G.deadT <= 0 && G.grab == null && G.invuln <= 0) {
        const fb = foeBox(e);
        if (overlap(p.x - 8, p.x + 8, p.y - p.h, p.y, fb.x0, fb.x1, fb.y0, fb.y1)) {
          const box = atkBox(p);
          if (!(box && overlap(box.x0, box.x1, box.y0, box.y1, fb.x0, fb.x1, fb.y0, fb.y1))) {
            hurt(2, '被翻滚撞到', e.x);
          }
        }
      }
      return;
    }

    if (e.kind === 'grab') {
      e.face = dx >= 0 ? 1 : -1;
      e.vx = e.face * 108 * sm;
      e.x += e.vx * dt;
      e.y = GROUND;
      e.walk = (e.walk || 0) + dt * 10;
      if (p && G.deadT <= 0 && !G.grab && G.climb <= 0 && Math.abs(dx) < 20 && Math.abs(p.y - e.y) < 18) {
        const box = atkBox(p);
        const fb = foeBox(e);
        if (box && overlap(box.x0, box.x1, box.y0, box.y1, fb.x0, fb.x1, fb.y0, fb.y1)) {
          e.lastHit = p.atk.id;
          killFoe(e, p.atk.kind, p.face);
        } else if (G.invuln <= 0 && (!p.atk || p.atk.t > 0.08)) {
          beginGrab(e);
        }
      }
      return;
    }

    if (e.kind === 'knife') {
      e.cd -= dt;
      if (e.state === 'throw') {
        e.t -= dt;
        e.vx = 0;
        if (e.t < 0.22 && !e.threw) {
          e.threw = true;
          if (G.knives.length < 12) G.knives.push(makeKnife(e.x + e.face * 16, e.y - 22, e.face));
          audio.knife();
        }
        if (e.t <= 0) {
          e.state = 'walk';
          e.cd = nightOn() ? 0.7 : 1.05;
          e.threw = false;
        }
      } else {
        e.face = dx >= 0 ? 1 : -1;
        const adx = Math.abs(dx);
        if (adx > 240) e.vx = e.face * 58 * sm;
        else if (adx < 70) e.vx = -e.face * 40 * sm;
        else e.vx = e.face * 18 * sm;
        e.x += e.vx * dt;
        e.walk = (e.walk || 0) + dt * 6;
        if (e.cd <= 0 && adx > 90 && adx < 280 && p) {
          e.state = 'throw';
          e.t = 0.42;
          e.threw = false;
        }
      }
      e.y = GROUND;
      if (p && G.deadT <= 0 && G.grab == null && G.invuln <= 0) {
        const fb = foeBox(e);
        if (overlap(p.x - 7, p.x + 7, p.y - p.h, p.y, fb.x0, fb.x1, fb.y0, fb.y1) && !atkBox(p)) {
          hurt(1, '被飞刀手撞到', e.x);
        }
      }
    }
  }
  function tickBoss(dt) {
    const e = G.boss;
    if (!e) return;
    if (e.flash > 0) e.flash -= dt;
    if (e.dead) {
      e.deadT -= dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.vy += GRAV * dt;
      e.spin += dt * 8;
      G.clearT += dt;
      if (G.clearT > 1.15 && G.mode === 'play') showOver(true);
      return;
    }
    const p = G.player;
    if (!p) return;
    const dx = p.x - e.x;
    e.face = dx >= 0 ? 1 : -1;
    if (e.state === 'hurt') {
      e.t -= dt;
      e.x += e.vx * dt;
      e.vx *= 0.9;
      if (e.t <= 0) e.state = 'idle';
      return;
    }
    if (e.state === 'punch') {
      e.t -= dt;
      if (e.t < 0.18 && e.t > 0.02 && p && G.invuln <= 0 && G.deadT <= 0 && G.grab == null) {
        const x0 = e.face > 0 ? e.x : e.x - 46;
        const x1 = e.face > 0 ? e.x + 46 : e.x;
        if (p.x > x0 && p.x < x1 && Math.abs(p.y - e.y) < 28) {
          hurt(2, '被赤尊打中', e.x);
        }
      }
      if (e.t <= 0) {
        e.state = 'idle';
        e.cd = nightOn() ? 0.45 : 0.7;
      }
      return;
    }
    e.cd -= dt;
    const adx = Math.abs(dx);
    if (adx > 48) {
      e.vx = e.face * 72 * spdMul();
      e.x += e.vx * dt;
      e.walk = (e.walk || 0) + dt * 7;
      e.state = 'walk';
    } else {
      e.vx = 0;
      e.state = 'idle';
    }
    e.y = GROUND;
    if (e.cd <= 0 && adx < 58) {
      e.state = 'punch';
      e.t = 0.38;
      audio.punch();
    }
  }
  function tickKnives(dt) {
    let i, k, p;
    p = G.player;
    for (i = G.knives.length - 1; i >= 0; i--) {
      k = G.knives[i];
      if (k.dead) {
        G.knives.splice(i, 1);
        continue;
      }
      k.x += k.vx * dt;
      if (k.x < G.camX - 80 || k.x > G.camX + VW + 80) {
        G.knives.splice(i, 1);
        continue;
      }
      if (p && G.deadT <= 0 && G.invuln <= 0 && G.grab == null) {
        if (Math.abs(k.x - p.x) < 12 && k.y < p.y - 8 && k.y > p.y - p.h + 2) {
          k.dead = true;
          hurt(2, '中刀了', k.x);
          burst(k.x, k.y, 6, CYN, 90, 0.2, 40);
        }
      }
    }
  }
  function pruneDead() {
    let i;
    for (i = G.enemies.length - 1; i >= 0; i--) {
      const e = G.enemies[i];
      if (e.dead && e.deadT <= 0) G.enemies.splice(i, 1);
      else if (!e.dead && (e.x < G.camX - 160 || e.x > G.camX + VW + 160)) G.enemies.splice(i, 1);
    }
  }
  function tickSpawn(dt) {
    if (G.arena) return;
    if (G.mode !== 'play' && G.mode !== 'title') return;
    G.spawnCd -= dt;
    if (G.spawnCd > 0) return;
    if (livingEnemies() >= maxFoes()) {
      G.spawnCd = 0.2;
      return;
    }
    const ahead = G.player && G.player.face > 0 ? 0.68 : 0.32;
    const side = Math.random() < ahead ? 1 : -1;
    spawnFoe(null, side);
    G.spawnCd = spawnInterval() * rand(0.75, 1.15);
  }
  function tickStairs(dt) {
    if (G.mode !== 'play' || G.floor >= FLOORS || G.grab || G.deadT > 0) return;
    const p = G.player;
    if (!p || !p.grounded) return;
    if (p.x > FLOOR_W - 58) startClimb();
  }
  function startClimb() {
    G.climb = 0.62;
    G.player.atk = null;
    G.player.vx = 0;
    audio.stairs();
    toast(FLOOR_META[G.floor] ? FLOOR_META[G.floor].short : '上楼', false, true);
    flash(CYN, 0.1);
  }
  function nextFloor() {
    G.climb = 0;
    G.floor += 1;
    G.enemies = [];
    G.knives = [];
    G.boss = null;
    G.arena = false;
    G.grab = null;
    G.player.x = 72;
    G.player.y = GROUND;
    G.player.vy = 0;
    G.player.vx = 0;
    G.player.face = 1;
    G.player.atk = null;
    G.camX = 0;
    G.invuln = 0.5;
    G.spawnCd = 0.45;
    addScore(1000 + G.floor * 200, G.player.x, G.player.y, '上楼');
    toast(floorMeta().name, false, true);
    G.hudDirty = true;
    setHint(G.floor === 5 ? '顶层 · 赤尊在尽头' : (nightOn() ? '夜袭更快 · 擒拿更多' : '冲向右侧楼梯'));
    burst(G.player.x, G.player.y - 16, 12, GOLD, 140, 0.35, 300);
  }
  function tickArena() {
    if (G.floor !== 5 || G.mode !== 'play') return;
    if (G.player && G.player.x > 1120) {
      G.arena = true;
      if (!G.boss) {
        G.boss = makeFoe('boss', 1480, -1);
        G.enemies = [];
        G.knives = [];
        toast('赤尊', false, true);
        audio.start();
        flash(HOT, 0.16);
        setHint('赤尊 · 多段打击 · 闪身出拳');
      }
    }
  }
  function tickCam(dt) {
    const p = G.player;
    if (!p) return;
    let want;
    if (G.arena) {
      want = clamp(p.x - VW * 0.42, FLOOR_W - VW - 20, FLOOR_W - VW);
    } else {
      const lead = p.face * 64;
      want = clamp(p.x - VW * 0.38 + lead, 0, Math.max(0, FLOOR_W - VW));
    }
    G.camX = lerp(G.camX, want, 1 - Math.pow(0.0008, dt));
    if (Math.abs(G.camX - want) < 0.35) G.camX = want;
  }

  function tick(dt) {
    G.clock += dt;
    if (G.intro > 0) G.intro -= dt;
    if (G.invuln > 0) G.invuln -= dt;
    if (G.hurtT > 0) G.hurtT -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    if (G.mode === 'title') {
      tickPlayer(dt, titleDemo());
      let i;
      for (i = 0; i < G.enemies.length; i++) tickEnemy(G.enemies[i], dt);
      tickKnives(dt);
      tickSpawn(dt);
      pruneDead();
      tickCam(dt);
      return;
    }
    if (G.climb > 0) {
      G.climb -= dt;
      tickPlayer(dt, null);
      if (G.climb <= 0) nextFloor();
      tickCam(dt);
      return;
    }
    if (G.deadT > 0) {
      G.deadT -= dt;
      tickPlayer(dt, null);
      let k;
      for (k = 0; k < G.enemies.length; k++) tickEnemy(G.enemies[k], dt);
      if (G.boss) tickBoss(dt);
      if (G.deadT <= 0) respawn();
      tickCam(dt);
      return;
    }
    if (G.mode !== 'play') {
      if (G.player) applyPhys(G.player, dt, false);
      return;
    }
    tickPlayer(dt, null);
    let j;
    for (j = 0; j < G.enemies.length; j++) tickEnemy(G.enemies[j], dt);
    tickBoss(dt);
    tickKnives(dt);
    tickSpawn(dt);
    tickArena();
    tickStairs(dt);
    pruneDead();
    tickCam(dt);
  }

  function titleDemo() {
    const p = G.player;
    if (!p) return { l: false, r: true, punch: false, kick: false, jump: false };
    let punch = false, kick = false, jump = false, r = true, l = false;
    let i, e, d;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (e.dead) continue;
      d = e.x - p.x;
      if (d > 8 && d < 52) {
        if (e.kind === 'tumble') kick = true;
        else punch = true;
        r = false;
      }
      if (e.kind === 'tumble' && d > 40 && d < 90 && p.grounded) jump = true;
    }
    if (p.x > 520) { r = false; l = true; }
    if (p.x < 80) { l = false; r = true; }
    return { l: l, r: r, punch: punch, kick: kick, jump: jump };
  }

  /* ---- setup ---- */
  function loadFloor(n, attract) {
    G.floor = n;
    G.enemies = [];
    G.knives = [];
    G.boss = null;
    G.arena = false;
    G.grab = null;
    G.player = makePlayer(attract ? 110 : 72);
    G.camX = 0;
    G.spawnCd = attract ? 0.3 : 0.55;
    G.clearT = 0;
    G.climb = 0;
    G.deadT = 0;
    G.hurtT = 0;
    if (!attract) {
      G.hp = HP_MAX;
      G.invuln = 0.35;
      G.intro = 0.7;
      resetFx();
    }
  }
  function startRun(kind) {
    audio.start();
    setModes(kind);
    G.mode = 'play';
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.lives = LIVES;
    G.nextLife = LIFE_EVERY;
    G.won = false;
    G.why = '';
    G.clock = 0;
    loadFloor(1, false);
    hideOverlay();
    setHint(nightOn() ? '夜袭更快 · 擒拿更多 · 踢翻滚客' : '一击必杀 · 拳短踢长 · 冲向楼梯');
    toast(nightOn() ? '夜袭' : '山门', false, !nightOn());
    syncHud();
    try { canvas.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
  }
  function showTitle() {
    G.mode = 'title';
    G.kind = G.kind === 'night' ? 'night' : 'five';
    G.score = 0;
    G.combo = 0;
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.invuln = 99;
    G.deadT = 0;
    loadFloor(1, true);
    G.enemies = [
      makeFoe('knife', 280, -1),
      makeFoe('tumble', 420, -1)
    ];
    G.enemies[1].vx = -150;
    resetFx();
    panel.className = 'panel';
    ovKicker.textContent = 'KUNG';
    ovTitle.textContent = '功夫';
    ovLead.innerHTML = '五层回廊，一击必杀。拳短踢长，跳踢打翻滚。<br />擒拿手要连打挣脱，顶层赤尊等你。';
    ovOps.textContent = OPS;
    ovStart.classList.remove('gone');
    ovEnd.classList.add('gone');
    overlay.classList.remove('end');
    showOverlay();
    setHint('一击必杀 · 拳 Z · 踢 X · 擒拿连打挣脱 · 体力空丢命');
    setModes(G.kind);
    syncHud();
  }
  function showOver(win) {
    G.mode = 'over';
    G.won = win;
    persistBest();
    panel.className = 'panel ' + (win ? 'win' : 'lose');
    ovKicker.textContent = win ? 'CLEAR' : 'DOWN';
    ovTitle.textContent = win ? (nightOn() ? '夜袭通关' : '五层已破') : (G.why || '体力空了');
    ovLead.textContent = (win ? '赤尊败了。' : '') +
      G.score + ' 分 · 最高连击 ×' + G.maxCombo +
      ' · ' + floorMeta().short +
      (win ? '' : ' · R 立刻再来');
    ovOps.textContent = 'R 或「再来」重开 · 顶栏重开随时可用';
    ovStart.classList.add('gone');
    ovEnd.classList.remove('gone');
    overlay.classList.add('end');
    showOverlay();
    if (win) {
      audio.win();
      screenKick('win-flash', 700);
      setHint('通关 · R 再来', 'hot');
    } else {
      audio.over();
      setHint('命尽 · R 重开', 'warn');
    }
    syncHud();
    try { ovAgain.focus(); } catch (e) { /* ignore */ }
  }
  function showOverlay() {
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
  }
  function hideOverlay() {
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('end');
  }
  function retry() {
    audio.ui();
    if (G.mode === 'title') startRun('five');
    else startRun(G.kind);
  }

  /* ---- draw ---- */
  function wx(x) {
    const sh = G.shake ? (hash2((G.clock * 80) | 0) - 0.5) * G.shake : 0;
    return ox + (x - G.camX + G.kickX + sh) * scale;
  }
  function wy(y) {
    const sh = G.shake ? (hash2((G.clock * 80 + 17) | 0) - 0.5) * G.shake * 0.6 : 0;
    return oy + (y + G.kickY + sh) * scale;
  }
  function clipWorld() {
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();
  }
  function floorTint() {
    const n = G.floor;
    if (nightOn()) {
      if (n === 5) return [48, 8, 18];
      if (n >= 3) return [36, 6, 22];
      return [28, 8, 16];
    }
    if (n === 5) return [42, 10, 8];
    if (n === 4) return [32, 8, 14];
    if (n === 3) return [28, 10, 16];
    if (n === 2) return [24, 12, 14];
    return [22, 10, 8];
  }
  function drawBg() {
    const t = floorTint();
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    g.addColorStop(0, nightOn() ? '#120614' : '#140808');
    g.addColorStop(0.45, rgba(t, 1));
    g.addColorStop(1, '#080204');
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const moonX = ox + (VW * 0.78) * scale;
    const moonY = oy + 52 * scale;
    ctx.fillStyle = rgba(GOLD, nightOn() ? 0.18 : 0.12);
    ctx.beginPath();
    ctx.arc(moonX, moonY, 28 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.7);
    ctx.beginPath();
    ctx.arc(moonX, moonY, 11 * scale, 0, TAU);
    ctx.fill();

    const x0 = Math.floor(G.camX / 140) * 140 - 140;
    let x, winH;
    for (x = x0; x < G.camX + VW + 160; x += 140) {
      const px = wx(x + 18);
      ctx.fillStyle = 'rgba(20, 8, 6, 0.85)';
      ctx.fillRect(px, wy(48), 18 * scale, (GROUND - 48) * scale);
      ctx.fillStyle = rgba(HOT, 0.12);
      ctx.fillRect(px + 6 * scale, wy(48), 4 * scale, (GROUND - 48) * scale);

      winH = 36 + hash2(x | 0) * 10;
      ctx.fillStyle = 'rgba(8, 2, 4, 0.7)';
      ctx.fillRect(wx(x + 52), wy(70), 48 * scale, winH * scale);
      ctx.fillStyle = rgba(GOLD, 0.06 + hash2((x + 3) | 0) * 0.05);
      ctx.fillRect(wx(x + 54), wy(72), 44 * scale, (winH - 4) * scale);
      ctx.strokeStyle = rgba(HOT, 0.28);
      ctx.lineWidth = 1.2 * scale;
      ctx.strokeRect(wx(x + 52), wy(70), 48 * scale, winH * scale);
      ctx.beginPath();
      ctx.moveTo(wx(x + 76), wy(70));
      ctx.lineTo(wx(x + 76), wy(70 + winH));
      ctx.stroke();

      const lx = x + 96;
      const bob = Math.sin(G.clock * 2.2 + x * 0.01) * 2;
      ctx.fillStyle = rgba(GOLD, 0.1);
      ctx.beginPath();
      ctx.arc(wx(lx), wy(86 + bob), 16 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT2, 0.85);
      ctx.beginPath();
      ctx.ellipse(wx(lx), wy(90 + bob), 6 * scale, 8 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(wx(lx), wy(88 + bob), 2.2 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.35);
      ctx.beginPath();
      ctx.moveTo(wx(lx), wy(48));
      ctx.lineTo(wx(lx), wy(82 + bob));
      ctx.stroke();
    }

    ctx.fillStyle = '#1a0a08';
    ctx.fillRect(ox, wy(GROUND - 8), VW * scale, (VH - (GROUND - 8)) * scale);
    ctx.fillStyle = rgba(HOT, 0.22);
    ctx.fillRect(ox, wy(GROUND - 8), VW * scale, 3 * scale);
    ctx.fillStyle = rgba(GOLD, 0.12);
    ctx.fillRect(ox, wy(GROUND - 6), VW * scale, 1.5 * scale);

    ctx.strokeStyle = 'rgba(255, 180, 80, 0.08)';
    ctx.lineWidth = 1;
    for (x = Math.floor(G.camX / 28) * 28; x < G.camX + VW + 40; x += 28) {
      ctx.beginPath();
      ctx.moveTo(wx(x), wy(GROUND - 6));
      ctx.lineTo(wx(x + 10), wy(VH - 8));
      ctx.stroke();
    }

    if (G.floor < FLOORS) drawStairs();
    else drawBossGate();
  }
  function drawStairs() {
    const sx0 = FLOOR_W - 70;
    let i;
    ctx.fillStyle = rgba(CYN, 0.08);
    ctx.fillRect(wx(sx0 - 10), wy(80), 90 * scale, (GROUND - 80) * scale);
    for (i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? rgba(HOT, 0.45) : rgba(GOLD, 0.35);
      ctx.fillRect(wx(sx0 + i * 4), wy(GROUND - 10 - i * 18), 46 * scale, 12 * scale);
    }
    ctx.fillStyle = rgba(CYN, 0.18 + Math.sin(G.clock * 4) * 0.06);
    ctx.fillRect(wx(sx0 + 8), wy(70), 36 * scale, 8 * scale);
    ctx.fillStyle = rgba(GOLD, 0.7);
    ctx.font = 'bold ' + (11 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('上', wx(sx0 + 26), wy(64));
  }
  function drawBossGate() {
    const gx = FLOOR_W - 90;
    ctx.fillStyle = rgba(HOT, 0.12);
    ctx.fillRect(wx(gx), wy(70), 70 * scale, (GROUND - 70) * scale);
    ctx.strokeStyle = rgba(GOLD, 0.45);
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(wx(gx + 8), wy(90), 54 * scale, (GROUND - 102) * scale);
    ctx.fillStyle = rgba(HOT, G.arena ? 0.35 : 0.18);
    ctx.fillRect(wx(gx + 14), wy(100), 42 * scale, (GROUND - 118) * scale);
  }
  function drawPerson(e, isPlayer) {
    const s = scale;
    const x = wx(e.x);
    const y = wy(e.y);
    const face = e.face || 1;
    const inv = isPlayer && G.invuln > 0 && ((G.clock * 18) | 0) % 2 === 0;
    if (inv && G.deadT <= 0) ctx.globalAlpha = 0.45;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(face * s, s);

    if (e.dead) ctx.rotate(e.spin || 0);

    const kind = isPlayer ? 'hero' : e.kind;
    const rolling = !isPlayer && e.kind === 'tumble' && !e.dead;
    if (rolling) {
      ctx.rotate(e.spin || 0);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(0, 2, 11, 4, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#2a8a44';
      ctx.beginPath();
      ctx.ellipse(0, -8, 11, 8, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#3dff7a';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(0, -8, 7, 5, 0, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = rgba(SKIN, 1);
      ctx.beginPath();
      ctx.arc(2, -10, 3.2, 0, TAU);
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
      return;
    }

    const punch = (isPlayer && e.atk && (e.atk.kind === 'punch' || e.atk.kind === 'jpunch')) ||
      (!isPlayer && e.state === 'throw') || (!isPlayer && e.state === 'punch');
    const kick = isPlayer && e.atk && (e.atk.kind === 'kick' || e.atk.kind === 'jkick');
    const hold = !isPlayer && e.state === 'hold';
    const hurtP = isPlayer && G.hurtT > 0;
    const air = isPlayer && !e.grounded;
    const walkP = (e.walk || 0);
    const leg = Math.sin(walkP) * (e.vx ? 5 : 0);

    let gi = GI, sash = HOT, hair = [28, 18, 16], pants = [236, 228, 216];
    if (kind === 'knife') { gi = [48, 72, 92]; sash = GOLD; hair = [20, 24, 28]; pants = [32, 48, 62]; }
    if (kind === 'grab') { gi = [92, 28, 72]; sash = MAG; hair = [40, 12, 32]; pants = [70, 18, 54]; }
    if (kind === 'boss') { gi = [92, 18, 16]; sash = GOLD; hair = [18, 10, 10]; pants = [60, 12, 12]; }
    if (kind === 'tumble') { gi = [36, 110, 58]; sash = LEAF; hair = [16, 40, 22]; pants = [28, 80, 44]; }
    if (e.flash > 0) {
      gi = [255, 255, 240]; sash = [255, 255, 255]; pants = [255, 250, 230];
    }

    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(0, 1.5, 10, 3.2, 0, 0, TAU);
    ctx.fill();

    const bodyH = kind === 'boss' ? 22 : kind === 'grab' ? 16 : 18;
    const headY = kind === 'boss' ? -36 : -30;

    ctx.fillStyle = rgba(pants, 1);
    if (kick) {
      ctx.fillRect(-4, -10, 5, 10);
      ctx.save();
      ctx.translate(2, -8);
      ctx.rotate(0.9);
      ctx.fillRect(0, 0, 5, 16);
      ctx.restore();
    } else if (air) {
      ctx.fillRect(-6, -10, 5, 11);
      ctx.fillRect(1, -8, 5, 9);
    } else {
      ctx.fillRect(-6, -10, 5, 10 + (hurtP ? 0 : leg * 0.3));
      ctx.fillRect(1, -10, 5, 10 - (hurtP ? 0 : leg * 0.3));
    }

    ctx.fillStyle = rgba(gi, 1);
    ctx.fillRect(-8, -10 - bodyH, 16, bodyH);
    ctx.fillStyle = rgba(sash, 1);
    ctx.fillRect(-8, -12, 16, 3);
    if (kind === 'boss') {
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.fillRect(-9, -10 - bodyH, 18, 3);
    }

    ctx.strokeStyle = rgba(gi, 1);
    ctx.lineWidth = 3.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (punch) {
      ctx.moveTo(-5, -22);
      ctx.lineTo(-10, -12);
      ctx.moveTo(4, -20);
      ctx.lineTo(18, -18);
    } else if (kick) {
      ctx.moveTo(-4, -20);
      ctx.lineTo(-8, -10);
      ctx.moveTo(4, -18);
      ctx.lineTo(8, -8);
    } else if (hold) {
      ctx.moveTo(-6, -18);
      ctx.lineTo(-16, -12);
      ctx.moveTo(6, -18);
      ctx.lineTo(16, -12);
    } else {
      ctx.moveTo(-6, -20);
      ctx.lineTo(-8 + Math.sin(walkP) * 2, -10);
      ctx.moveTo(6, -20);
      ctx.lineTo(8 - Math.sin(walkP) * 2, -10);
    }
    ctx.stroke();

    if (punch) {
      ctx.fillStyle = rgba(SKIN, 1);
      ctx.beginPath();
      ctx.arc(20, -18, 2.6, 0, TAU);
      ctx.fill();
    }

    ctx.fillStyle = rgba(SKIN, 1);
    ctx.beginPath();
    ctx.arc(0, headY, kind === 'boss' ? 7.2 : 6.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(hair, 1);
    ctx.beginPath();
    ctx.arc(-1, headY - 2.2, kind === 'boss' ? 7.4 : 6.2, Math.PI, TAU);
    ctx.fill();
    if (kind === 'boss') {
      ctx.fillRect(-1.2, headY - 14, 2.4, 8);
      ctx.fillStyle = rgba(GOLD, 1);
      ctx.beginPath();
      ctx.arc(0, headY - 14, 2.2, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#1a1010';
    ctx.beginPath();
    ctx.arc(2.2, headY, 1.05, 0, TAU);
    ctx.fill();

    if (isPlayer && e.atk && (e.atk.kind === 'kick' || e.atk.kind === 'jkick') && e.atk.t < 0.16) {
      ctx.strokeStyle = rgba(CYN, 0.7);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(10, -8, 14, -0.4, 1.1);
      ctx.stroke();
    }
    if (isPlayer && e.atk && (e.atk.kind === 'punch' || e.atk.kind === 'jpunch') && e.atk.t < 0.12) {
      ctx.strokeStyle = rgba(HOT, 0.75);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(12, -18, 10, -0.6, 0.5);
      ctx.stroke();
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }
  function drawKnife(k) {
    const x = wx(k.x);
    const y = wy(k.y);
    const s = scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(k.face * s, s);
    ctx.fillStyle = '#c8d4e0';
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-8, 2.2);
    ctx.lineTo(-8, -2.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8a5a28';
    ctx.fillRect(-10, -1.4, 4, 2.8);
    ctx.restore();
  }
  function drawFx() {
    let i, p, a, s;
    s = scale;
    for (i = 0; i < rings.length; i++) {
      p = rings[i];
      a = p.life / p.max;
      ctx.strokeStyle = rgba(p.rgb, a * 0.8);
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.arc(wx(p.x), wy(p.y), p.r * s, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < slashes.length; i++) {
      p = slashes[i];
      a = p.life / p.max;
      ctx.save();
      ctx.translate(wx(p.x), wy(p.y));
      ctx.scale(p.face * s, s);
      ctx.strokeStyle = p.kind === 'kick' || p.kind === 'jkick' ? rgba(CYN, a) : rgba(HOT, a);
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, 16, -0.9, 0.8);
      ctx.stroke();
      ctx.restore();
    }
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      a = p.life / p.max;
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(wx(p.x), wy(p.y), p.r * s * (0.4 + a), 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < sparks.length; i++) {
      p = sparks[i];
      a = p.life / p.max;
      ctx.strokeStyle = rgba(p.rgb, a);
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath();
      ctx.moveTo(wx(p.x), wy(p.y));
      ctx.lineTo(wx(p.x - p.vx * 0.04), wy(p.y - p.vy * 0.04));
      ctx.stroke();
    }
    ctx.font = 'bold ' + (12 * s) + 'px sans-serif';
    ctx.textAlign = 'center';
    for (i = 0; i < floats.length; i++) {
      p = floats[i];
      a = p.life / p.max;
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.fillText(p.text, wx(p.x), wy(p.y));
    }
  }
  function drawGrabMeter() {
    if (!G.grab || G.mode !== 'play') return;
    const p = G.player;
    const need = mashNeed();
    const t = clamp(G.grab.mash / need, 0, 1);
    const x = wx(p.x);
    const y = wy(p.y - 52);
    const w = 48 * scale;
    ctx.fillStyle = 'rgba(8,2,4,0.7)';
    ctx.fillRect(x - w * 0.5, y, w, 7 * scale);
    ctx.fillStyle = rgba(CYN, 0.9);
    ctx.fillRect(x - w * 0.5, y, w * t, 7 * scale);
    ctx.strokeStyle = rgba(MAG, 0.8);
    ctx.strokeRect(x - w * 0.5, y, w, 7 * scale);
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.font = 'bold ' + (11 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('连打！', x, y - 6 * scale);
  }
  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 1.6);
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
  }
  function drawLetterbox() {
    ctx.fillStyle = '#0b0302';
    if (oy > 0) {
      ctx.fillRect(0, 0, W, oy);
      ctx.fillRect(0, oy + VH * scale, W, H);
    }
    if (ox > 0) {
      ctx.fillRect(0, 0, ox, H);
      ctx.fillRect(ox + VW * scale, 0, W, H);
    }
  }
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    clipWorld();
    drawBg();
    let i;
    for (i = 0; i < G.knives.length; i++) drawKnife(G.knives[i]);
    for (i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].dead) drawPerson(G.enemies[i], false);
    }
    for (i = 0; i < G.enemies.length; i++) {
      if (!G.enemies[i].dead) drawPerson(G.enemies[i], false);
    }
    if (G.boss) drawPerson(G.boss, false);
    if (G.player) drawPerson(G.player, true);
    drawFx();
    drawGrabMeter();
    drawFlash();
    ctx.restore();
    drawLetterbox();
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
    kickEdge.down = keys.kick && !kickEdge.was;
    jumpEdge.down = keys.jump && !jumpEdge.was;
    if (punchEdge.down && G.player) G.player.punchBuf = BUFFER;
    if (kickEdge.down && G.player) G.player.kickBuf = BUFFER;
    if (jumpEdge.down && G.player) G.player.jumpBuf = BUFFER;
    punchEdge.was = keys.punch;
    kickEdge.was = keys.kick;
    jumpEdge.was = keys.jump;
    if (G.grab && G.mode === 'play' && G.deadT <= 0 && (punchEdge.down || kickEdge.down)) {
      G.grab.mash += 1;
      audio.mash();
      if (G.player) spark(G.player.x, G.player.y - 20, G.player.face, CYN);
    }
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
    if (code === 'KeyZ' || k === 'z' || k === 'Z' || k === 'j' || k === 'J') keys.punch = down;
    if (code === 'KeyX' || k === 'x' || k === 'X' || k === 'k' || k === 'K') keys.kick = down;
    if (space) keys.jumpSpace = down;
    keys.jump = keys.u || keys.jumpSpace;

    if (down && (isMove || space || k === 'Enter' || code === 'KeyZ' || code === 'KeyX')) e.preventDefault();
    if (!down) return;

    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      retry();
      return;
    }
    if (overlayOpen()) {
      if (G.mode === 'title') {
        if (k === '1' || space || k === 'Enter') {
          keys.jump = false;
          keys.jumpSpace = false;
          startRun('five');
          return;
        }
        if (k === '2') { startRun('night'); return; }
      }
      if (G.mode === 'over') {
        if (k === '1' || space || k === 'Enter') {
          keys.jump = false;
          keys.jumpSpace = false;
          startRun(G.kind);
          return;
        }
        if (k === '2') { showTitle(); return; }
      }
    }
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
  bindHold(document.getElementById('btn-jump'), function (v) { keys.jump = v; });
  bindHold(document.getElementById('btn-punch'), function (v) { keys.punch = v; });
  bindHold(document.getElementById('btn-kick'), function (v) { keys.kick = v; });

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
  btnFive.addEventListener('click', function () {
    audio.ensure();
    startRun('five');
  });
  btnNight.addEventListener('click', function () {
    audio.ensure();
    startRun('night');
  });
  modeFive.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'title') { setModes('five'); return; }
    startRun('five');
  });
  modeNight.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'title') { setModes('night'); return; }
    startRun('night');
  });
  ovAgain.addEventListener('click', function () {
    audio.ensure();
    startRun(G.kind);
  });
  ovMenu.addEventListener('click', function () {
    audio.ensure();
    audio.ui();
    showTitle();
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

  function selfCheck() {
    if (FLOORS !== 5) throw new Error('5 floors');
    if (HP_MAX !== 8) throw new Error('8 hp pips');
    if (LIVES !== 3) throw new Error('3 lives');
    if (BEST_KEY !== 'playbox-kung-leap-best') throw new Error('best key');
  }
  selfCheck();

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (e) { /* ignore */ }
  loadBest();
  resize();
  showTitle();
  requestAnimationFrame(frame);
})();
