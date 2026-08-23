'use strict';

/* 功夫2 — Kung-Fu Master sequel remake.
   Neon tower floors, crash = lose a life, Space punch / Shift-Z kick.
   Distinct from 功夫 (temple energy + grabbers + Z/X) and 终斗 (street HP brawler). */

(function () {
  const VW = 640;
  const VH = 360;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const FLOORS = 5;
  const FLOOR_W = 1760;
  const GROUND = 300;
  const WALK = 148;
  const JUMP_V = 368;
  const GRAV = 1240;
  const MAX_FALL = 640;
  const COYOTE = 0.09;
  const BUFFER = 0.12;
  const INVULN = 1.15;
  const DIE_T = 0.82;
  const COMBO_WIN = 1.32;
  const BEST_KEY = 'playbox-kung-fu2-best';
  const MUTE_KEY = 'playbox-kung-fu2-mute';
  const OPS = '方向键 / WASD 走跳 · 空格拳 · Shift/Z 踢 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 122, 20];
  const HOT2 = [255, 154, 66];
  const WHT = [246, 240, 232];
  const LEAF = [61, 255, 122];
  const SKIN = [232, 176, 144];
  const NAVY = [26, 40, 72];
  const BLU = [64, 140, 255];

  const ATK = {
    punch: { dur: 0.16, hit0: 0.03, hit1: 0.12, range: 38, y0: 14, y1: 34, stop: 0.048, kb: 250, score: 100, name: '拳' },
    kick: { dur: 0.22, hit0: 0.04, hit1: 0.16, range: 52, y0: -2, y1: 22, stop: 0.058, kb: 300, score: 200, name: '踢' },
    jkick: { dur: 0.28, hit0: 0.03, hit1: 0.22, range: 48, y0: -8, y1: 32, stop: 0.066, kb: 340, score: 300, name: '跳踢' },
    jpunch: { dur: 0.18, hit0: 0.03, hit1: 0.13, range: 36, y0: 12, y1: 36, stop: 0.05, kb: 230, score: 120, name: '跳拳' }
  };

  const FLOOR_META = [
    { name: '一层 · 霓虹门', short: '一层', rush: 0.72, dart: 0.28, leap: 0, hawk: 0 },
    { name: '二层 · 金库廊', short: '二层', rush: 0.32, dart: 0.52, leap: 0.16, hawk: 0 },
    { name: '三层 · 夜宴厅', short: '三层', rush: 0.22, dart: 0.26, leap: 0.44, hawk: 0.08 },
    { name: '四层 · 天桥', short: '四层', rush: 0.16, dart: 0.22, leap: 0.26, hawk: 0.36 },
    { name: '塔顶 · 塔尊', short: '塔顶', rush: 0.28, dart: 0.24, leap: 0.24, hawk: 0.24 }
  ];

  const KIND_SCORE = { rush: 100, dart: 150, leap: 200, hawk: 250, boss: 5000 };
  const KIND_NAME = { rush: '冲拳', dart: '暗器', leap: '飞腿', hawk: '夜鸢', boss: '塔尊' };

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
  function coreOn() {
    return G.kind === 'core';
  }
  function floorMeta() {
    return FLOOR_META[clamp((G.floor | 0) - 1, 0, 4)];
  }
  function spdMul() {
    return coreOn() ? 1.28 : 1;
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
  const pipsEl = document.getElementById('pips');
  const hintEl = document.getElementById('hint');
  const toastEl = document.getElementById('toast');
  const chainPop = document.getElementById('chain-pop');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const modeKfu = document.getElementById('mode-kfu');
  const modeCore = document.getElementById('mode-core');
  const btnKfu = document.getElementById('btn-kfu');
  const btnCore = document.getElementById('btn-core');
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

  const keys = { l: false, r: false, u: false, d: false, punch: false, kick: false, jump: false };
  const kickHeld = { shift: false, z: false };
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
    kind: 'kfu',
    floor: 1,
    score: 0,
    best: 0,
    bestF: 0,
    bestN: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    lives: LIVES,
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
    arena: false,
    spawnCd: 0,
    clearT: 0,
    why: '',
    won: false,
    hudDirty: true,
    player: null,
    enemies: [],
    shots: [],
    boss: null,
    demoT: 0
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
      this.noise(0.055, 0.07, 1500, 'highpass');
      this.beep(220, 0.05, 'sawtooth', 0.03, 86);
    },
    kick: function () {
      this.ensure();
      this.noise(0.08, 0.085, 640, 'bandpass');
      this.beep(132, 0.08, 'sawtooth', 0.045, 52);
    },
    hit: function (combo, heavy) {
      this.ensure();
      const p = 1 + Math.min(7, combo) * 0.07;
      this.noise(0.12, heavy ? 0.22 : 0.15, 210, 'lowpass');
      this.beep(176 * p, 0.1, 'square', 0.085, 58);
      this.beep((heavy ? 960 : 700) * p, 0.07, 'triangle', 0.05, 420 * p);
      if (heavy) this.beep(1280 * p, 0.09, 'square', 0.04, 1680 * p);
    },
    explode: function () {
      this.ensure();
      this.noise(0.18, 0.2, 180, 'lowpass');
      this.beep(160, 0.14, 'sawtooth', 0.06, 48);
      this.beep(640, 0.1, 'square', 0.04, 180);
    },
    shot: function () {
      this.ensure();
      this.noise(0.06, 0.07, 2100, 'highpass');
      this.beep(980, 0.07, 'square', 0.04, 420);
    },
    swat: function () {
      this.ensure();
      this.beep(1040, 0.06, 'triangle', 0.05, 1680);
      this.noise(0.06, 0.09, 1700, 'highpass');
      this.beep(520, 0.05, 'square', 0.035, 220);
    },
    wave: function () {
      this.ensure();
      this.noise(0.12, 0.12, 280, 'lowpass');
      this.beep(180, 0.14, 'sawtooth', 0.05, 70);
    },
    hawk: function () {
      this.ensure();
      this.beep(720, 0.05, 'triangle', 0.03, 420);
      this.beep(980, 0.06, 'square', 0.025, 620);
    },
    jump: function () {
      this.ensure();
      this.beep(390, 0.07, 'square', 0.03, 196);
    },
    land: function () {
      this.ensure();
      this.noise(0.05, 0.05, 280, 'lowpass');
    },
    crash: function () {
      this.ensure();
      this.noise(0.2, 0.2, 160, 'lowpass');
      this.beep(240, 0.16, 'sawtooth', 0.06, 60);
      this.beep(90, 0.22, 'sine', 0.05, 40);
    },
    stairs: function () {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.045, 523);
      this.beep(523, 0.1, 'triangle', 0.04, 784);
    },
    bossHit: function () {
      this.ensure();
      this.noise(0.16, 0.2, 150, 'lowpass');
      this.beep(128, 0.14, 'square', 0.07, 48);
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
    G.best = coreOn() ? G.bestN : G.bestF;
  }
  function persistBest() {
    if (coreOn()) {
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
    const count = REDUCE ? Math.max(3, (n * 0.4) | 0) : n;
    for (i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const s = rand(spd * 0.35, spd);
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - rand(20, 90),
        life: life, max: life,
        r: rand(1.4, 3.6),
        rgb: rgb,
        g: g == null ? 520 : g
      });
    }
    capArr(particles, 180);
  }
  function spark(x, y, face, rgb) {
    sparks.push({
      x: x, y: y,
      vx: face * rand(80, 200),
      vy: rand(-140, -20),
      life: rand(0.12, 0.24),
      max: 0.24,
      rgb: rgb || GOLD
    });
    capArr(sparks, 60);
  }
  function ring(x, y, rgb) {
    rings.push({ x: x, y: y, r: 6, life: 0.3, max: 0.3, rgb: rgb || CYN });
    capArr(rings, 24);
  }
  function slashFx(x, y, face, kind) {
    slashes.push({ x: x, y: y, face: face, kind: kind, life: 0.15, max: 0.15 });
    capArr(slashes, 12);
  }
  function floatTxt(x, y, text, rgb) {
    floats.push({ x: x, y: y, text: text, life: 0.7, max: 0.7, rgb: rgb || GOLD });
    capArr(floats, 20);
  }
  function dust(x, y, n) {
    burst(x, y, n || 4, [180, 140, 110], 40, 0.28, 180);
  }
  function explode(x, y, rgb) {
    burst(x, y, REDUCE ? 10 : 22, rgb || HOT, 260, 0.46, 420);
    ring(x, y, rgb || GOLD);
    audio.explode();
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
      p.r += dt * 96;
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
      walk: 0
    };
  }
  function makeFoe(kind, x, face) {
    const e = {
      kind: kind,
      x: x, y: GROUND, vx: 0, vy: 0, face: face || 1,
      w: 16, h: 30,
      hp: 1,
      state: 'walk',
      t: rand(0.08, 0.4),
      cd: rand(0.2, 0.9),
      dead: false,
      deadT: 0,
      flash: 0,
      spin: 0,
      lastHit: 0,
      walk: 0,
      threw: false,
      hop: 0
    };
    if (kind === 'rush') {
      e.w = 16; e.h = 30; e.state = 'run';
    }
    if (kind === 'dart') {
      e.w = 15; e.h = 30; e.cd = rand(0.4, 1.0);
    }
    if (kind === 'leap') {
      e.w = 16; e.h = 28; e.state = 'idle'; e.cd = rand(0.1, 0.4);
    }
    if (kind === 'hawk') {
      e.w = 22; e.h = 14; e.y = GROUND - rand(56, 88);
      e.state = 'fly'; e.hop = rand(0, TAU);
    }
    if (kind === 'boss') {
      e.w = 24; e.h = 44;
      e.hp = coreOn() ? 13 : 10;
      e.state = 'idle';
      e.t = 0.5;
      e.cd = 0.6;
    }
    return e;
  }
  function makeShot(kind, x, y, face) {
    if (kind === 'star') {
      return {
        kind: 'star', x: x, y: y,
        vx: face * (coreOn() ? 290 : 236),
        vy: 0, face: face, w: 12, h: 12,
        rot: 0, dead: false, life: 2.4
      };
    }
    return {
      kind: 'wave', x: x, y: y,
      vx: face * (coreOn() ? 240 : 190),
      vy: 0, face: face, w: 28, h: 14,
      rot: 0, dead: false, life: 2.2
    };
  }

  function livingEnemies() {
    let n = 0, i;
    for (i = 0; i < G.enemies.length; i++) if (!G.enemies[i].dead) n++;
    return n;
  }
  function maxFoes() {
    const base = [4, 5, 5, 6, 4][clamp(G.floor - 1, 0, 4)];
    return coreOn() ? base + 2 : base;
  }
  function spawnInterval() {
    const base = [1.28, 1.1, 0.96, 0.84, 1.12][clamp(G.floor - 1, 0, 4)];
    return (coreOn() ? base * 0.66 : base) / (1 + (G.floor - 1) * 0.04);
  }
  function pickKind() {
    const m = floorMeta();
    let rsh = m.rush, d = m.dart, l = m.leap, h = m.hawk;
    if (coreOn()) {
      d = Math.min(0.5, d + 0.1);
      h = Math.min(0.4, h + 0.1);
      const rest = Math.max(0.08, 1 - d - h);
      const s = rsh + l;
      rsh = s > 0 ? rsh / s * rest : rest * 0.5;
      l = rest - rsh;
    }
    const r = Math.random();
    if (r < rsh) return 'rush';
    if (r < rsh + d) return 'dart';
    if (r < rsh + d + l) return 'leap';
    return 'hawk';
  }
  function spawnFoe(kind, side) {
    const left = G.camX - 40;
    const right = G.camX + VW + 40;
    const x = side < 0 ? left : right;
    const face = side < 0 ? 1 : -1;
    const e = makeFoe(kind || pickKind(), x, face);
    if (e.kind === 'rush') e.vx = face * (128 * spdMul());
    if (e.kind === 'hawk') e.vx = face * (150 * spdMul());
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
      G.lives = Math.min(LIFE_CAP, G.lives + 1);
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
    if (G.mode !== 'play') return;
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
    G.kind = kind === 'core' ? 'core' : 'kfu';
    if (modeKfu) modeKfu.setAttribute('aria-pressed', G.kind === 'kfu' ? 'true' : 'false');
    if (modeCore) modeCore.setAttribute('aria-pressed', G.kind === 'core' ? 'true' : 'false');
    G.best = coreOn() ? G.bestN : G.bestF;
    G.hudDirty = true;
  }
  function setHint(t, cls) {
    if (!hintEl) return;
    hintEl.textContent = t;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
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
      modeLabel.textContent = coreOn() ? '功核' : '功夫2';
      modeLabel.classList.toggle('core', coreOn());
    }
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
    const h = e.h;
    return { x0: e.x - e.w * 0.5, x1: e.x + e.w * 0.5, y0: e.y - h, y1: e.y };
  }
  function shotBox(s) {
    return { x0: s.x - s.w * 0.5, x1: s.x + s.w * 0.5, y0: s.y - s.h * 0.5, y1: s.y + s.h * 0.5 };
  }
  function startAttack(kind) {
    const p = G.player;
    if (!p || p.atk) return;
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
    e.deadT = 0.72;
    e.vx = face * (heavy ? 360 : 270);
    e.vy = heavy ? -300 : -220;
    e.spin = face * rand(8, 14);
    if (e.kind !== 'hawk') e.y = Math.min(e.y, GROUND);
    const col = e.kind === 'dart' ? MAG : e.kind === 'leap' ? CYN : e.kind === 'hawk' ? GOLD : e.kind === 'boss' ? GOLD : HOT2;
    explode(e.x, e.y - e.h * 0.45, col);
    burst(e.x, e.y - e.h * 0.5, heavy ? 8 : 5, WHT, 180, 0.28, 360);
  }
  function killFoe(e, atkKind, face) {
    if (e.dead) return;
    const a = ATK[atkKind] || ATK.punch;
    const heavy = atkKind === 'jkick' || atkKind === 'kick';
    if (e.kind === 'boss') {
      e.hp -= 1;
      e.flash = 0.16;
      e.vx = face * 90;
      e.state = 'hurt';
      e.t = 0.22;
      audio.bossHit();
      hitStop(0.072);
      shake(7);
      flash(GOLD, 0.14);
      burst(e.x, e.y - 22, 14, GOLD, 190, 0.36, 400);
      screenKick('thump', 160);
      addScore(a.score + 280, e.x, e.y, '塔尊');
      bumpCombo();
      if (e.hp <= 0) {
        throwFoe(e, face, true);
        flash(GOLD, 0.3);
        screenKick('boom', 200);
        addScore(5000, e.x, e.y - 10, '击败');
        G.clearT = 0.01;
        toast('塔尊倒下', false, true);
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
    addScore(a.score + Math.max(0, (KIND_SCORE[e.kind] || 100) - 100), e.x, e.y, KIND_NAME[e.kind] || a.name);
  }
  function swatShot(s, face) {
    if (s.dead) return;
    s.dead = true;
    const heavy = s.kind === 'wave';
    const col = heavy ? MAG : GOLD;
    burst(s.x, s.y, heavy ? 16 : 10, col, heavy ? 220 : 160, 0.34, 80);
    ring(s.x, s.y, col);
    spark(s.x, s.y, face || 1, CYN);
    audio.swat();
    hitStop(heavy ? 0.07 : 0.052);
    shake(heavy ? 6 : 4);
    G.kickX = -(face || 1) * 3;
    screenKick(heavy ? 'boom' : 'hit', 150);
    flash(col, 0.08);
    bumpCombo();
    addScore(heavy ? 120 : 80, s.x, s.y, heavy ? '破波' : '挡');
  }
  function crash(why, srcX) {
    if (G.mode !== 'play') return;
    if (G.invuln > 0 || G.deadT > 0 || G.climb > 0) return;
    const p = G.player;
    G.why = why || '撞上了';
    G.lives -= 1;
    G.deadT = DIE_T;
    G.hudDirty = true;
    if (p) {
      p.atk = null;
      p.vy = -180;
      p.vx = srcX != null ? (srcX < p.x ? 160 : -160) : p.vx * 0.3;
    }
    audio.crash();
    hitStop(0.06);
    shake(9);
    flash(MAG, 0.22);
    screenKick('die', 300);
    if (p) explode(p.x, p.y - 18, MAG);
    toast(G.why, true, false);
    breakCombo();
  }
  function respawn() {
    if (G.lives <= 0) {
      showOver(false);
      return;
    }
    G.invuln = INVULN;
    G.deadT = 0;
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

  /* ---- player ---- */
  function applyPhys(p, dt) {
    p.vy += GRAV * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    p.x += p.vx * dt;
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
    const minX = G.arena ? Math.max(22, FLOOR_W - VW + 28) : 22;
    p.x = clamp(p.x, minX, FLOOR_W - 22);
  }
  function tickPlayer(dt, demo) {
    const p = G.player;
    if (!p) return;
    const inPlay = G.mode === 'play' && !demo;
    const left = demo ? demo.l : (inPlay && inputOk() ? keys.l : false);
    const right = demo ? demo.r : (inPlay && inputOk() ? keys.r : false);

    if (G.deadT > 0) {
      applyPhys(p, dt);
      p.atk = null;
      return;
    }
    if (G.climb > 0) {
      p.vx = 0;
      p.x += 42 * dt;
      p.y -= 118 * dt;
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
      if (p.grounded) p.vx *= 0.52;
      const box = atkBox(p);
      if (box) resolveHits(p, box);
      if (p.atk.t >= a.dur) p.atk = null;
    } else {
      let ax = 0;
      if (left) ax -= 1;
      if (right) ax += 1;
      if (ax !== 0) p.face = ax > 0 ? 1 : -1;
      p.vx = ax * WALK;
      if (ax) p.walk += dt * 8.4;
      else p.walk = 0;
    }

    const jumpPress = (demo && demo.jump) || (inPlay && inputOk() && (p.jumpBuf > 0 || jumpEdge.down));
    if (jumpPress && (p.grounded || p.coyote > 0) && !p.atk) {
      p.vy = -JUMP_V;
      p.grounded = false;
      p.coyote = 0;
      p.jumpBuf = 0;
      audio.jump();
      dust(p.x, GROUND, 4);
      hitStop(0.028);
    }

    applyPhys(p, dt);
    resolveAttackShots(p);
    if (inPlay) resolveCrash(p);
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
  function resolveAttackShots(p) {
    const box = atkBox(p);
    if (!box) return;
    let i, s, sb;
    for (i = 0; i < G.shots.length; i++) {
      s = G.shots[i];
      if (s.dead) continue;
      sb = shotBox(s);
      if (overlap(box.x0, box.x1, box.y0, box.y1, sb.x0, sb.x1, sb.y0, sb.y1)) {
        swatShot(s, p.face);
      }
    }
  }
  function resolveCrash(p) {
    if (G.invuln > 0 || G.deadT > 0 || G.climb > 0) return;
    const box = atkBox(p);
    const px0 = p.x - 7, px1 = p.x + 7, py0 = p.y - p.h + 4, py1 = p.y - 2;
    let i, e, fb, s, sb;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (e.dead) continue;
      fb = foeBox(e);
      if (overlap(px0, px1, py0, py1, fb.x0, fb.x1, fb.y0, fb.y1)) {
        if (box && overlap(box.x0, box.x1, box.y0, box.y1, fb.x0, fb.x1, fb.y0, fb.y1)) continue;
        crash(e.kind === 'hawk' ? '被夜鸢撞上' : e.kind === 'leap' ? '被飞腿撞上' : '撞上了', e.x);
        return;
      }
    }
    if (G.boss && !G.boss.dead) {
      fb = foeBox(G.boss);
      if (overlap(px0, px1, py0, py1, fb.x0, fb.x1, fb.y0, fb.y1)) {
        if (!(box && overlap(box.x0, box.x1, box.y0, box.y1, fb.x0, fb.x1, fb.y0, fb.y1))) {
          crash('撞上塔尊', G.boss.x);
          return;
        }
      }
    }
    for (i = 0; i < G.shots.length; i++) {
      s = G.shots[i];
      if (s.dead) continue;
      sb = shotBox(s);
      if (overlap(px0, px1, py0, py1, sb.x0, sb.x1, sb.y0, sb.y1)) {
        if (box && overlap(box.x0, box.x1, box.y0, box.y1, sb.x0, sb.x1, sb.y0, sb.y1)) continue;
        crash(s.kind === 'wave' ? '被气波击中' : '中暗器了', s.x);
        return;
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
    const p = G.player;
    const sm = spdMul();
    const dx = p ? p.x - e.x : 0;

    if (e.kind === 'hawk') {
      e.hop += dt * 5.4;
      e.x += e.vx * dt;
      e.y += Math.sin(e.hop) * 18 * dt;
      if (p && Math.abs(dx) < 90 && e.y < p.y - 20 && e.state === 'fly') {
        e.state = 'dive';
        e.vy = 180 * sm;
        audio.hawk();
      }
      if (e.state === 'dive') {
        e.y += e.vy * dt;
        e.vy += 220 * dt;
        if (e.y > GROUND - 18) {
          e.y = GROUND - 18;
          e.state = 'fly';
          e.vy = 0;
        }
      }
      e.face = e.vx >= 0 ? 1 : -1;
      e.walk += dt * 10;
      return;
    }

    if (e.kind === 'rush') {
      e.face = dx >= 0 ? 1 : -1;
      e.vx = e.face * 132 * sm;
      e.x += e.vx * dt;
      e.y = GROUND;
      e.walk += dt * 11;
      e.state = 'run';
      return;
    }

    if (e.kind === 'leap') {
      e.face = dx >= 0 ? 1 : -1;
      e.cd -= dt;
      if (e.state === 'hop') {
        e.x += e.vx * dt;
        e.vy += GRAV * dt;
        e.y += e.vy * dt;
        if (e.y >= GROUND) {
          e.y = GROUND;
          e.vy = 0;
          e.state = 'idle';
          e.cd = coreOn() ? 0.28 : 0.42;
          dust(e.x, GROUND, 3);
        }
      } else {
        e.y = GROUND;
        e.vx = 0;
        if (e.cd <= 0) {
          e.state = 'hop';
          e.vy = -320 * (0.85 + 0.2 * sm);
          e.vx = e.face * 160 * sm;
        }
      }
      e.walk += dt * 8;
      return;
    }

    if (e.kind === 'dart') {
      e.cd -= dt;
      if (e.state === 'throw') {
        e.t -= dt;
        e.vx = 0;
        if (e.t < 0.2 && !e.threw) {
          e.threw = true;
          if (G.shots.length < 14) {
            G.shots.push(makeShot('star', e.x + e.face * 16, e.y - 22, e.face));
            audio.shot();
          }
        }
        if (e.t <= 0) {
          e.state = 'walk';
          e.cd = coreOn() ? 0.62 : 0.98;
        }
        e.y = GROUND;
        return;
      }
      e.face = dx >= 0 ? 1 : -1;
      const far = Math.abs(dx) > 150;
      e.vx = e.face * (far ? 72 : 38) * sm;
      e.x += e.vx * dt;
      e.y = GROUND;
      e.walk += dt * 7;
      if (e.cd <= 0 && p && Math.abs(dx) < 320 && Math.abs(dx) > 40) {
        e.state = 'throw';
        e.t = 0.38;
        e.threw = false;
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
      return;
    }
    const p = G.player;
    if (!p) return;
    const sm = spdMul();
    const dx = p.x - e.x;
    e.cd -= dt;
    e.walk += dt * 6;

    if (e.state === 'hurt') {
      e.t -= dt;
      e.x += e.vx * dt;
      e.vx *= 0.86;
      e.y = GROUND;
      if (e.t <= 0) {
        e.state = 'idle';
        e.cd = 0.22;
      }
      return;
    }
    if (e.state === 'punch') {
      e.t -= dt;
      e.vx = 0;
      e.y = GROUND;
      if (e.t <= 0) {
        e.state = 'idle';
        e.cd = 0.36;
      }
      return;
    }
    if (e.state === 'wave') {
      e.t -= dt;
      e.vx = 0;
      if (e.t < 0.22 && !e.threw) {
        e.threw = true;
        G.shots.push(makeShot('wave', e.x + e.face * 22, GROUND - 10, e.face));
        audio.wave();
        shake(4);
      }
      if (e.t <= 0) {
        e.state = 'idle';
        e.cd = 0.5;
      }
      return;
    }
    if (e.state === 'jump') {
      e.x += e.vx * dt;
      e.vy += GRAV * dt;
      e.y += e.vy * dt;
      e.x = clamp(e.x, FLOOR_W - VW + 40, FLOOR_W - 40);
      if (e.y >= GROUND) {
        e.y = GROUND;
        e.vy = 0;
        e.state = 'idle';
        e.cd = 0.34;
        dust(e.x, GROUND, 10);
        shake(7);
        screenKick('thump', 180);
        burst(e.x, GROUND, 12, HOT, 140, 0.28, 240);
      }
      return;
    }

    e.face = dx >= 0 ? 1 : -1;
    e.y = GROUND;
    if (Math.abs(dx) > 46) {
      e.vx = e.face * 88 * sm;
      e.x += e.vx * dt;
      e.state = 'walk';
    } else {
      e.vx = 0;
      e.state = 'idle';
    }
    e.x = clamp(e.x, FLOOR_W - VW + 40, FLOOR_W - 40);

    if (e.cd <= 0) {
      const r = Math.random();
      if (Math.abs(dx) < 56 && r < 0.55) {
        e.state = 'punch';
        e.t = 0.34;
        audio.punch();
      } else if (r < 0.72) {
        e.state = 'wave';
        e.t = 0.46;
        e.threw = false;
      } else {
        e.state = 'jump';
        e.vy = -420;
        e.vx = e.face * 140;
        audio.jump();
      }
      e.cd = 0.8;
    }
  }
  function tickShots(dt) {
    let i, s;
    for (i = G.shots.length - 1; i >= 0; i--) {
      s = G.shots[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rot += dt * (s.kind === 'star' ? 14 : 6);
      if (s.dead || s.life <= 0 || s.x < G.camX - 80 || s.x > G.camX + VW + 80) {
        G.shots.splice(i, 1);
      }
    }
  }
  function tickSpawn(dt) {
    if (G.mode !== 'play' || G.deadT > 0 || G.climb > 0 || G.clearT > 0) return;
    if (G.floor === 5 && G.arena && G.boss) return;
    G.spawnCd -= dt;
    if (G.spawnCd > 0) return;
    if (livingEnemies() >= maxFoes()) {
      G.spawnCd = 0.2;
      return;
    }
    const p = G.player;
    let side = 1;
    if (p) {
      if (p.face > 0) side = Math.random() < 0.72 ? 1 : -1;
      else side = Math.random() < 0.72 ? -1 : 1;
      if (p.x < G.camX + 90) side = 1;
      if (p.x > G.camX + VW - 90) side = -1;
    }
    spawnFoe(null, side);
    G.spawnCd = spawnInterval();
  }
  function tickCamera(dt) {
    const p = G.player;
    if (!p) return;
    let target;
    if (G.arena) {
      target = FLOOR_W - VW;
    } else {
      target = p.x - VW * 0.36;
    }
    target = clamp(target, 0, Math.max(0, FLOOR_W - VW));
    G.camX = lerp(G.camX, target, 1 - Math.pow(0.0008, dt));
    if (G.floor === 5 && !G.arena && p.x > FLOOR_W - VW - 20) {
      G.arena = true;
      G.camX = FLOOR_W - VW;
      beginBoss();
    }
  }
  function beginBoss() {
    if (G.boss) return;
    G.enemies = G.enemies.filter(function (e) { return e.dead; });
    G.boss = makeFoe('boss', FLOOR_W - 120, -1);
    toast('塔尊现身', false, true);
    audio.start();
    flash(GOLD, 0.16);
    shake(6);
    setHint('塔尊 · 拳踢连打 · 挡气波', 'hot');
  }
  function tickStairs(dt) {
    if (G.mode !== 'play' || G.floor >= FLOORS || G.deadT > 0 || G.climb > 0) return;
    const p = G.player;
    if (!p || !p.grounded) return;
    if (p.x > FLOOR_W - 58) {
      G.climb = 0.72;
      p.atk = null;
      audio.stairs();
      toast('上楼', false, true);
      addScore(1000 + 200 * G.floor, p.x, p.y, '上楼');
    }
  }
  function tickClimb(dt) {
    G.climb -= dt;
    if (G.climb <= 0) {
      G.climb = 0;
      loadFloor(G.floor + 1, false);
    }
  }
  function cullDead() {
    let i;
    for (i = G.enemies.length - 1; i >= 0; i--) {
      const e = G.enemies[i];
      if (e.dead && e.deadT <= 0) G.enemies.splice(i, 1);
      else if (!e.dead && (e.x < G.camX - 220 || e.x > G.camX + VW + 220)) G.enemies.splice(i, 1);
    }
    if (G.boss && G.boss.dead && G.boss.deadT <= 0) G.boss = null;
  }

  /* ---- floors / modes ---- */
  function loadFloor(n, demo) {
    G.floor = clamp(n, 1, FLOORS);
    G.arena = false;
    G.spawnCd = demo ? 99 : 0.7;
    G.intro = demo ? 0 : 0.45;
    G.climb = 0;
    G.clearT = 0;
    G.boss = null;
    G.enemies = [];
    G.shots = [];
    G.camX = 0;
    G.player = makePlayer(72);
    if (!demo) {
      G.invuln = 0.85;
      G.deadT = 0;
    }
    G.hudDirty = true;
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
    G.demoT = 0;
    loadFloor(1, false);
    hideOverlay();
    setHint(coreOn() ? '功核更密 · 暗器更快 · 一撞丢命' : '一撞丢命 · 空格拳 · Shift 踢 · 冲向楼梯');
    toast(coreOn() ? '功核' : '霓虹门', false, !coreOn());
    syncHud();
    try { canvas.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
  }
  function showTitle() {
    G.mode = 'title';
    G.kind = G.kind === 'core' ? 'core' : 'kfu';
    G.score = 0;
    G.combo = 0;
    G.lives = LIVES;
    G.invuln = 99;
    G.deadT = 0;
    G.demoT = 0;
    loadFloor(1, true);
    G.enemies = [
      makeFoe('rush', 320, -1),
      makeFoe('dart', 470, -1)
    ];
    G.enemies[0].vx = -120;
    resetFx();
    panel.className = 'panel';
    ovKicker.textContent = 'KFU2';
    ovTitle.textContent = '功夫2';
    ovLead.innerHTML = '霓虹塔楼，一撞丢命。空格出拳，Shift 踢腿。<br />四层回廊打穿，塔顶塔尊等你。';
    ovOps.textContent = OPS;
    ovStart.classList.remove('gone');
    ovEnd.classList.add('gone');
    overlay.classList.remove('end');
    showOverlay();
    setHint('一撞丢命 · 空格拳 · Shift/Z 踢 · 上键跳 · 挡暗器有顿帧');
    setModes(G.kind);
    syncHud();
  }
  function showOver(win) {
    G.mode = 'over';
    G.won = win;
    persistBest();
    panel.className = 'panel ' + (win ? 'win' : 'lose');
    ovKicker.textContent = win ? 'CLEAR' : 'DOWN';
    ovTitle.textContent = win ? (coreOn() ? '功核通关' : '塔楼已破') : (G.why || '撞上了');
    ovLead.textContent = (win ? '塔尊败了。' : '') +
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
    if (G.mode === 'title') startRun('kfu');
    else startRun(G.kind);
  }

  function tickTitle(dt) {
    G.clock += dt;
    G.demoT += dt;
    const p = G.player;
    const demo = { l: false, r: true, jump: false, punch: false, kick: false };
    if (p) {
      if (p.x > 420) demo.r = false;
      if (((G.demoT * 2.2) | 0) !== (((G.demoT - dt) * 2.2) | 0) && (G.demoT % 1.6) < 0.2) demo.punch = true;
      if ((G.demoT % 2.8) > 2.5 && (G.demoT % 2.8) < 2.6) demo.kick = true;
      if ((G.demoT % 3.6) > 3.2 && (G.demoT % 3.6) < 3.3) demo.jump = true;
    }
    tickPlayer(dt, demo);
    let i;
    for (i = 0; i < G.enemies.length; i++) tickEnemy(G.enemies[i], dt);
    tickShots(dt);
    G.camX = lerp(G.camX, clamp((p ? p.x : 80) - VW * 0.38, 0, FLOOR_W - VW), 0.08);
  }
  function tick(dt) {
    G.clock += dt;
    if (G.mode === 'title') {
      tickTitle(dt);
      return;
    }
    if (G.mode !== 'play') return;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    if (G.invuln > 0) G.invuln -= dt;
    if (G.intro > 0) G.intro -= dt;
    if (G.deadT > 0) {
      G.deadT -= dt;
      tickPlayer(dt, false);
      let i;
      for (i = 0; i < G.enemies.length; i++) tickEnemy(G.enemies[i], dt);
      if (G.boss) tickBoss(dt);
      tickShots(dt);
      if (G.deadT <= 0) respawn();
      return;
    }
    if (G.climb > 0) {
      tickPlayer(dt, false);
      tickClimb(dt);
      return;
    }
    tickPlayer(dt, false);
    let i;
    for (i = 0; i < G.enemies.length; i++) tickEnemy(G.enemies[i], dt);
    tickBoss(dt);
    tickShots(dt);
    tickSpawn(dt);
    tickCamera(dt);
    tickStairs(dt);
    cullDead();
    if (G.clearT > 0) {
      G.clearT += dt;
      if (G.clearT > 1.55) {
        if (!coreOn()) addScore(8000, G.player ? G.player.x : 0, GROUND - 40, '破塔');
        else addScore(10000, G.player ? G.player.x : 0, GROUND - 40, '功核');
        showOver(true);
      }
    }
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
    if (coreOn()) {
      if (n === 5) return [42, 8, 22];
      if (n >= 3) return [34, 8, 20];
      return [26, 8, 16];
    }
    if (n === 5) return [28, 12, 10];
    if (n === 4) return [22, 10, 18];
    if (n === 3) return [24, 10, 14];
    if (n === 2) return [20, 12, 10];
    return [18, 10, 8];
  }
  function drawBg() {
    const t = floorTint();
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    g.addColorStop(0, coreOn() ? '#100614' : '#140a06');
    g.addColorStop(0.42, rgba(t, 1));
    g.addColorStop(1, '#080204');
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const moonX = ox + (VW * 0.8) * scale;
    const moonY = oy + 48 * scale;
    ctx.fillStyle = rgba(GOLD, coreOn() ? 0.16 : 0.12);
    ctx.beginPath();
    ctx.arc(moonX, moonY, 30 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.72);
    ctx.beginPath();
    ctx.arc(moonX, moonY, 11 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.5);
    ctx.beginPath();
    ctx.arc(moonX + 4 * scale, moonY - 2 * scale, 3.2 * scale, 0, TAU);
    ctx.fill();

    let x;
    const sky0 = Math.floor(G.camX * 0.22 / 80) * 80 - 80;
    for (x = sky0; x < G.camX * 0.22 + VW + 100; x += 80) {
      const hgt = 40 + hash2((x / 80) | 0) * 90;
      const px = ox + (x - G.camX * 0.22) * scale;
      ctx.fillStyle = 'rgba(18, 8, 14, 0.85)';
      ctx.fillRect(px, wy(GROUND - 8 - hgt), 48 * scale, hgt * scale);
      ctx.fillStyle = rgba(CYN, 0.05 + hash2(x | 0) * 0.06);
      ctx.fillRect(px + 8 * scale, wy(GROUND - 8 - hgt + 10), 8 * scale, 8 * scale);
      ctx.fillStyle = rgba(HOT, 0.07);
      ctx.fillRect(px + 22 * scale, wy(GROUND - 8 - hgt + 18), 8 * scale, 8 * scale);
    }

    const x0 = Math.floor(G.camX / 128) * 128 - 128;
    for (x = x0; x < G.camX + VW + 160; x += 128) {
      const px = wx(x + 10);
      const colH = GROUND - 52;
      ctx.fillStyle = G.floor === 5 ? 'rgba(22, 10, 8, 0.55)' : 'rgba(22, 10, 16, 0.9)';
      ctx.fillRect(px, wy(52), 22 * scale, colH * scale);
      ctx.fillStyle = rgba(HOT, 0.14);
      ctx.fillRect(px + 8 * scale, wy(52), 4 * scale, colH * scale);

      if (G.floor < 5) {
        let row, col;
        for (row = 0; row < 4; row++) {
          for (col = 0; col < 2; col++) {
            const lit = hash2((x + row * 9 + col * 3 + G.floor * 17) | 0);
            const flicker = 0.55 + Math.sin(G.clock * (1.4 + lit) + x * 0.02) * 0.2;
            const wy0 = 68 + row * 42;
            ctx.fillStyle = 'rgba(8, 2, 4, 0.7)';
            ctx.fillRect(wx(x + 46 + col * 36), wy(wy0), 26 * scale, 28 * scale);
            const glow = lit > 0.22 ? (lit > 0.7 ? rgba(GOLD, 0.14 * flicker) : lit > 0.45 ? rgba(MAG, 0.12 * flicker) : rgba(CYN, 0.12 * flicker)) : 'rgba(10,4,6,0.4)';
            ctx.fillStyle = glow;
            ctx.fillRect(wx(x + 48 + col * 36), wy(wy0 + 2), 22 * scale, 24 * scale);
          }
        }
      }

      const lx = x + 108;
      const bob = Math.sin(G.clock * 2.4 + x * 0.012) * 2;
      ctx.fillStyle = rgba(G.floor === 3 ? MAG : G.floor === 4 ? CYN : HOT, 0.1);
      ctx.beginPath();
      ctx.arc(wx(lx), wy(78 + bob), 14 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(G.floor === 3 ? MAG : G.floor === 4 ? CYN : HOT2, 0.85);
      ctx.fillRect(wx(lx - 7), wy(72 + bob), 14 * scale, 5 * scale);
      ctx.fillStyle = rgba(GOLD, 0.55);
      ctx.fillRect(wx(lx - 5), wy(78 + bob), 10 * scale, 2 * scale);
    }

    if (G.floor === 5) {
      ctx.fillStyle = 'rgba(18, 8, 6, 0.7)';
      ctx.fillRect(ox, wy(GROUND - 14), VW * scale, 8 * scale);
      ctx.strokeStyle = rgba(GOLD, 0.28);
      ctx.lineWidth = 1.4 * scale;
      ctx.strokeRect(wx(FLOOR_W - 280), wy(GROUND - 6), 160 * scale, 4 * scale);
      ctx.fillStyle = rgba(HOT, 0.12);
      ctx.beginPath();
      ctx.ellipse(wx(FLOOR_W - 200), wy(GROUND - 4), 70 * scale, 10 * scale, 0, 0, TAU);
      ctx.fill();
    }

    ctx.fillStyle = '#160a06';
    ctx.fillRect(ox, wy(GROUND - 6), VW * scale, (VH - (GROUND - 6)) * scale);
    ctx.fillStyle = rgba(HOT, 0.28);
    ctx.fillRect(ox, wy(GROUND - 6), VW * scale, 3 * scale);
    ctx.fillStyle = rgba(GOLD, 0.14);
    ctx.fillRect(ox, wy(GROUND - 4), VW * scale, 1.4 * scale);

    ctx.strokeStyle = 'rgba(255, 160, 60, 0.08)';
    ctx.lineWidth = 1;
    for (x = Math.floor(G.camX / 28) * 28; x < G.camX + VW + 40; x += 28) {
      ctx.beginPath();
      ctx.moveTo(wx(x), wy(GROUND - 4));
      ctx.lineTo(wx(x + 10), wy(VH - 8));
      ctx.stroke();
    }

    if (G.floor < FLOORS) drawStairs();
    else drawBossGate();
  }
  function drawStairs() {
    const sx0 = FLOOR_W - 72;
    let i;
    ctx.fillStyle = rgba(CYN, 0.08);
    ctx.fillRect(wx(sx0 - 10), wy(78), 92 * scale, (GROUND - 78) * scale);
    for (i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? rgba(HOT, 0.5) : rgba(GOLD, 0.38);
      ctx.fillRect(wx(sx0 + i * 4), wy(GROUND - 10 - i * 18), 48 * scale, 12 * scale);
    }
    ctx.fillStyle = rgba(CYN, 0.2 + Math.sin(G.clock * 4) * 0.07);
    ctx.fillRect(wx(sx0 + 8), wy(68), 38 * scale, 8 * scale);
    ctx.fillStyle = rgba(GOLD, 0.75);
    ctx.font = 'bold ' + (11 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('上', wx(sx0 + 27), wy(62));
  }
  function drawBossGate() {
    const gx = FLOOR_W - 96;
    ctx.fillStyle = rgba(HOT, 0.12);
    ctx.fillRect(wx(gx), wy(64), 78 * scale, (GROUND - 64) * scale);
    ctx.strokeStyle = rgba(GOLD, 0.5);
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(wx(gx + 10), wy(86), 56 * scale, (GROUND - 98) * scale);
    ctx.fillStyle = rgba(HOT, G.arena ? 0.38 : 0.16);
    ctx.fillRect(wx(gx + 16), wy(96), 44 * scale, (GROUND - 114) * scale);
    ctx.fillStyle = rgba(GOLD, 0.55);
    ctx.font = 'bold ' + (11 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('塔', wx(gx + 38), wy(78));
  }
  function drawPerson(e, isPlayer) {
    const s = scale;
    const x = wx(e.x);
    const y = wy(e.y);
    const face = e.face || 1;
    const inv = isPlayer && G.invuln > 0 && G.deadT <= 0 && ((G.clock * 18) | 0) % 2 === 0;
    if (inv) ctx.globalAlpha = 0.42;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(face * s, s);

    if (e.dead) ctx.rotate(e.spin || 0);

    const kind = isPlayer ? 'hero' : e.kind;
    if (!isPlayer && e.kind === 'hawk') {
      drawHawkLocal(e);
      ctx.restore();
      ctx.globalAlpha = 1;
      return;
    }

    const punch = (isPlayer && e.atk && (e.atk.kind === 'punch' || e.atk.kind === 'jpunch')) ||
      (!isPlayer && (e.state === 'throw' || e.state === 'punch' || e.state === 'wave'));
    const kick = isPlayer && e.atk && (e.atk.kind === 'kick' || e.atk.kind === 'jkick');
    const air = (isPlayer && !e.grounded) || (!isPlayer && e.kind === 'leap' && e.state === 'hop') || (!isPlayer && e.state === 'jump');
    const walkP = e.walk || 0;
    const leg = Math.sin(walkP) * (e.vx ? 5 : 0);

    let gi = NAVY, sash = HOT, hair = [18, 16, 22], pants = [18, 28, 48];
    if (kind === 'hero') { gi = NAVY; sash = HOT; hair = [16, 14, 20]; pants = [20, 30, 52]; }
    if (kind === 'rush') { gi = [184, 72, 28]; sash = GOLD; hair = [40, 22, 16]; pants = [72, 32, 18]; }
    if (kind === 'dart') { gi = [92, 24, 72]; sash = MAG; hair = [28, 12, 28]; pants = [64, 16, 52]; }
    if (kind === 'leap') { gi = [20, 92, 110]; sash = CYN; hair = [12, 28, 36]; pants = [16, 64, 78]; }
    if (kind === 'boss') { gi = [18, 12, 14]; sash = GOLD; hair = [12, 8, 8]; pants = [28, 14, 12]; }
    if (e.flash > 0) {
      gi = [255, 255, 240]; sash = [255, 255, 255]; pants = [255, 250, 230];
    }

    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(0, 1.5, 10, 3.2, 0, 0, TAU);
    ctx.fill();

    const bodyH = kind === 'boss' ? 24 : 18;
    const headY = kind === 'boss' ? -38 : -30;

    ctx.fillStyle = rgba(pants, 1);
    if (kick) {
      ctx.fillRect(-4, -10, 5, 10);
      ctx.save();
      ctx.translate(2, -8);
      ctx.rotate(0.95);
      ctx.fillRect(0, 0, 5, 17);
      ctx.restore();
    } else if (air) {
      ctx.fillRect(-6, -10, 5, 11);
      ctx.fillRect(1, -8, 5, 9);
    } else {
      ctx.fillRect(-6, -10, 5, 10 + leg * 0.3);
      ctx.fillRect(1, -10, 5, 10 - leg * 0.3);
    }

    ctx.fillStyle = rgba(gi, 1);
    ctx.fillRect(-8, -10 - bodyH, 16, bodyH);
    ctx.fillStyle = rgba(sash, 1);
    ctx.fillRect(-8, -12, 16, 3);
    if (kind === 'hero') {
      ctx.fillStyle = rgba(CYN, 0.85);
      ctx.fillRect(-8, -16, 3, 3);
      ctx.fillRect(5, -16, 3, 3);
    }
    if (kind === 'boss') {
      ctx.fillStyle = rgba(GOLD, 0.75);
      ctx.fillRect(-10, -10 - bodyH, 20, 4);
      ctx.fillRect(-11, -22, 5, 8);
      ctx.fillRect(6, -22, 5, 8);
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
    ctx.arc(0, headY, kind === 'boss' ? 7.4 : 6.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(hair, 1);
    ctx.beginPath();
    ctx.arc(-1, headY - 2.2, kind === 'boss' ? 7.6 : 6.2, Math.PI, TAU);
    ctx.fill();
    if (kind === 'boss') {
      ctx.fillStyle = rgba(GOLD, 1);
      ctx.beginPath();
      ctx.moveTo(-6, headY - 6);
      ctx.lineTo(-2, headY - 16);
      ctx.lineTo(0, headY - 8);
      ctx.lineTo(2, headY - 16);
      ctx.lineTo(6, headY - 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.85);
      ctx.fillRect(-3.2, headY - 1, 6.4, 2.2);
    }
    ctx.fillStyle = '#1a1010';
    ctx.beginPath();
    ctx.arc(2.2, headY, 1.05, 0, TAU);
    ctx.fill();

    if (isPlayer && e.atk && (e.atk.kind === 'kick' || e.atk.kind === 'jkick') && e.atk.t < 0.16) {
      ctx.strokeStyle = rgba(CYN, 0.75);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(10, -8, 14, -0.4, 1.1);
      ctx.stroke();
    }
    if (isPlayer && e.atk && (e.atk.kind === 'punch' || e.atk.kind === 'jpunch') && e.atk.t < 0.12) {
      ctx.strokeStyle = rgba(HOT, 0.8);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(12, -18, 10, -0.6, 0.5);
      ctx.stroke();
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }
  function drawHawkLocal(e) {
    const flap = Math.sin((e.hop || 0) * 2.2) * 0.55;
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 8, 2.4, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = e.flash > 0 ? '#fff8d0' : rgba(GOLD, 1);
    ctx.beginPath();
    ctx.ellipse(0, -6, 9, 5, 0, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.translate(-2, -7);
    ctx.rotate(-0.5 + flap);
    ctx.fillStyle = e.flash > 0 ? '#fff' : rgba(HOT, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-16, -6);
    ctx.lineTo(-4, 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(2, -7);
    ctx.rotate(0.5 - flap);
    ctx.fillStyle = e.flash > 0 ? '#fff' : rgba(HOT2, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(16, -6);
    ctx.lineTo(4, 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = rgba(MAG, 0.9);
    ctx.beginPath();
    ctx.moveTo(8, -6);
    ctx.lineTo(13, -4);
    ctx.lineTo(8, -3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1a1010';
    ctx.beginPath();
    ctx.arc(4, -7, 1.1, 0, TAU);
    ctx.fill();
  }
  function drawShot(s) {
    const x = wx(s.x);
    const y = wy(s.y);
    const sc = scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(s.rot);
    if (s.kind === 'wave') {
      ctx.scale(s.face * sc, sc);
      ctx.fillStyle = rgba(MAG, 0.18);
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 10, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(MAG, 0.9);
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, 12, -1.1, 1.1);
      ctx.stroke();
      ctx.strokeStyle = rgba(GOLD, 0.7);
      ctx.beginPath();
      ctx.arc(0, 0, 7, -0.9, 0.9);
      ctx.stroke();
    } else {
      ctx.scale(sc, sc);
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      let i;
      for (i = 0; i < 4; i++) {
        const a = i * Math.PI * 0.5;
        ctx.lineTo(Math.cos(a) * 8, Math.sin(a) * 8);
        ctx.lineTo(Math.cos(a + 0.25 * Math.PI) * 3.2, Math.sin(a + 0.25 * Math.PI) * 3.2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.beginPath();
      ctx.arc(0, 0, 2.2, 0, TAU);
      ctx.fill();
    }
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
  function drawBossHp() {
    if (!G.boss || G.boss.dead || G.mode !== 'play') return;
    const max = coreOn() ? 13 : 10;
    const t = clamp(G.boss.hp / max, 0, 1);
    const x = ox + 80 * scale;
    const y = oy + 16 * scale;
    const w = 200 * scale;
    ctx.fillStyle = 'rgba(8,2,4,0.7)';
    ctx.fillRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.fillRect(x, y, w * t, 8 * scale);
    ctx.strokeStyle = rgba(HOT, 0.8);
    ctx.strokeRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.font = 'bold ' + (10 * scale) + 'px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('塔尊', x, y - 4 * scale);
  }
  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 1.6);
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
  }
  function drawLetterbox() {
    ctx.fillStyle = '#100804';
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
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);
    for (i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].dead) drawPerson(G.enemies[i], false);
    }
    for (i = 0; i < G.enemies.length; i++) {
      if (!G.enemies[i].dead) drawPerson(G.enemies[i], false);
    }
    if (G.boss) drawPerson(G.boss, false);
    if (G.player) drawPerson(G.player, true);
    drawFx();
    drawBossHp();
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
  }
  function refreshKick() {
    keys.kick = kickHeld.shift || kickHeld.z;
  }
  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const isShift = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight';
    const isZ = code === 'KeyZ' || k === 'z' || k === 'Z';
    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (space) keys.punch = down;
    if (isShift) kickHeld.shift = down;
    if (isZ) kickHeld.z = down;
    refreshKick();
    keys.jump = keys.u;

    if (down && (isMove || space || isShift || isZ || k === 'Enter')) e.preventDefault();
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
          keys.punch = false;
          keys.jump = false;
          startRun('kfu');
          return;
        }
        if (k === '2') { startRun('core'); return; }
      }
      if (G.mode === 'over') {
        if (k === '1' || space || k === 'Enter') {
          keys.punch = false;
          keys.jump = false;
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
  bindHold(document.getElementById('btn-jump'), function (v) { keys.jump = v; keys.u = v; });
  bindHold(document.getElementById('btn-punch'), function (v) { keys.punch = v; });
  bindHold(document.getElementById('btn-kick'), function (v) { kickHeld.z = v; refreshKick(); });

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
  btnKfu.addEventListener('click', function () {
    audio.ensure();
    startRun('kfu');
  });
  btnCore.addEventListener('click', function () {
    audio.ensure();
    startRun('core');
  });
  modeKfu.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'title') { setModes('kfu'); return; }
    startRun('kfu');
  });
  modeCore.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'title') { setModes('core'); return; }
    startRun('core');
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
    if (LIVES !== 3) throw new Error('3 lives');
    if (BEST_KEY !== 'playbox-kung-fu2-best') throw new Error('best key');
    if (ATK.punch.range >= ATK.kick.range) throw new Error('kick longer');
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
