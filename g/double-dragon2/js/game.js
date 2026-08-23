'use strict';

/* 双截2 — Double Dragon II: The Revenge remake.
   Jump-kick, grab-throw, crash = lose a life. No bats/whips, no rescue, no HP bar.
   Distinct from 双截 (Z/X 拳脚+棍鞭+救人), 怒二 (升龙+体力), 怒三 (暴冲电旋). */

(function () {
  const VW = 640;
  const VH = 360;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const COMBO_WIN = 1.4;
  const BELT_TOP = 224;
  const BELT_BOT = 324;
  const WALK_X = 196;
  const WALK_Y = 118;
  const AIR = 0.86;
  const JUMP_V = 490;
  const GRAV = 1320;
  const MAX_FALL = 640;
  const INVULN = 1.28;
  const DIE_T = 0.82;
  const GRAB_RANGE = 26;
  const BEST_KEY = 'playbox-double-dragon2-best';
  const MUTE_KEY = 'playbox-double-dragon2-mute';
  const OPS = '方向键 / WASD 走 · 空格出拳 · Shift / Z 飞踢 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 232, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 74, 10];
  const HOT2 = [255, 122, 58];
  const WHT = [246, 239, 232];
  const LEAF = [61, 255, 122];
  const SKIN = [232, 184, 148];
  const BLU = [42, 86, 196];

  const COMBO_PUNCH = [
    { dmg: 4, range: 32, dur: 0.15, hit0: 0.04, hit1: 0.12, kb: 72, stop: 0.04 },
    { dmg: 5, range: 36, dur: 0.17, hit0: 0.04, hit1: 0.13, kb: 94, stop: 0.052 },
    { dmg: 8, range: 44, dur: 0.3, hit0: 0.06, hit1: 0.2, kb: 176, stop: 0.072, stun: true, kick: true }
  ];
  const JKICK = { dmg: 7, range: 42, dur: 0.72, kb: 210, stop: 0.07, stun: true };
  const THROW_HIT = { dmg: 10, kb: 270, stop: 0.078 };
  const SLAM_HIT = { dmg: 8, kb: 190, stop: 0.06 };

  const FOES = {
    thug: {
      hp: 8, spd: 86, dmg: 1, range: 28, score: 160, w: 16, h: 30,
      think: 0.5, punchDur: 0.28, name: '巷匪'
    },
    kicker: {
      hp: 8, spd: 98, dmg: 1, range: 36, score: 220, w: 15, h: 30,
      think: 0.42, punchDur: 0.26, name: '飞踢', jkick: true
    },
    axe: {
      hp: 14, spd: 58, dmg: 1, range: 40, score: 280, w: 20, h: 36,
      think: 0.68, punchDur: 0.42, name: '斧手', heavy: true
    },
    blade: {
      hp: 8, spd: 90, dmg: 1, range: 92, score: 240, w: 15, h: 29,
      think: 0.64, punchDur: 0.32, name: '飞刃', thrower: true
    },
    heli: {
      hp: 48, spd: 90, dmg: 1, range: 36, score: 4000, w: 22, h: 40,
      think: 0.36, punchDur: 0.32, name: '铁卫', boss: true, charge: true
    },
    grove: {
      hp: 64, spd: 102, dmg: 1, range: 40, score: 5200, w: 20, h: 38,
      think: 0.32, punchDur: 0.28, name: '林煞', boss: true, jkick: true
    },
    don: {
      hp: 90, spd: 96, dmg: 1, range: 38, score: 9000, w: 22, h: 42,
      think: 0.34, punchDur: 0.3, name: '影枭', boss: true, jkick: true
    }
  };

  const STAGES = [
    {
      name: '停机坪', boss: '铁卫', w: 2040, theme: 'heli', bossKind: 'heli',
      pits: [[460, 70], [920, 74]],
      packs: [
        { x: 160, gate: 420, foes: [['thug', 230, 262], ['thug', 330, 286]] },
        { x: 640, gate: 880, foes: [['thug', 680, 258], ['kicker', 760, 278], ['thug', 840, 266]] },
        { x: 1100, gate: 1400, foes: [['kicker', 1160, 260], ['thug', 1260, 284], ['blade', 1360, 254]] },
        { x: 1500, gate: 1780, foes: [['thug', 1540, 258], ['kicker', 1640, 276], ['thug', 1720, 264]] }
      ]
    },
    {
      name: '密林', boss: '林煞', w: 2200, theme: 'grove', bossKind: 'grove',
      pits: [],
      packs: [
        { x: 170, gate: 480, foes: [['kicker', 230, 262], ['thug', 340, 284]] },
        { x: 520, gate: 860, foes: [['axe', 570, 258], ['kicker', 670, 278], ['thug', 770, 256]] },
        { x: 900, gate: 1260, foes: [['thug', 940, 260], ['axe', 1040, 282], ['kicker', 1140, 254], ['blade', 1220, 274]] },
        { x: 1320, gate: 1720, foes: [['kicker', 1360, 258], ['axe', 1480, 280], ['thug', 1580, 264], ['kicker', 1680, 272]] }
      ]
    },
    {
      name: '罪府', boss: '影枭', w: 2360, theme: 'manor', bossKind: 'don',
      pits: [],
      packs: [
        { x: 160, gate: 500, foes: [['thug', 220, 262], ['blade', 320, 280], ['kicker', 400, 256]] },
        { x: 540, gate: 920, foes: [['axe', 580, 256], ['kicker', 680, 278], ['thug', 780, 264], ['blade', 860, 272]] },
        { x: 980, gate: 1400, foes: [['kicker', 1020, 258], ['axe', 1120, 274], ['blade', 1220, 286], ['thug', 1320, 254]] },
        { x: 1460, gate: 1900, foes: [['kicker', 1500, 258], ['axe', 1600, 282], ['thug', 1700, 264], ['blade', 1780, 276], ['kicker', 1860, 256]] }
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
  function comboMul(n) {
    return 1 + Math.min(4, Math.floor(Math.max(0, (n | 0) - 1) / 2));
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
  function stageAt(i) {
    return STAGES[((i | 0) % STAGES.length + STAGES.length) % STAGES.length];
  }
  function denser() {
    return G.kind === 'core';
  }
  function jumpH() {
    return (JUMP_V * JUMP_V) / (2 * GRAV);
  }
  function jumpAir() {
    return WALK_X * AIR * (2 * JUMP_V / GRAV);
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (COMBO_PUNCH.length !== 3) throw new Error('3 punch');
    if (!COMBO_PUNCH[2].kick) throw new Error('finisher kick');
    if (comboMul(1) !== 1) throw new Error('combo 1');
    if (comboMul(2) !== 1) throw new Error('combo 2');
    if (comboMul(3) !== 2) throw new Error('combo 3');
    if (comboMul(9) !== 5) throw new Error('combo cap');
    if (BELT_BOT - BELT_TOP < 80) throw new Error('belt');
    if (jumpH() < 70) throw new Error('jump height');
    if (jumpAir() < 100) throw new Error('jump air');
    if (!FOES.thug || !FOES.kicker || !FOES.axe || !FOES.blade) throw new Error('foes');
    if (!FOES.heli || !FOES.grove || !FOES.don) throw new Error('bosses');
    if (!FOES.kicker.jkick) throw new Error('kicker jkick');
    if (!FOES.grove.jkick) throw new Error('grove jkick');
    if (!FOES.blade.thrower) throw new Error('blade throw');
    if (!FOES.heli.charge) throw new Error('heli charge');
    if (FOES.heli.hp >= FOES.grove.hp || FOES.grove.hp >= FOES.don.hp) throw new Error('boss hp');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (BEST_KEY !== 'playbox-double-dragon2-best') throw new Error('best key');
    if (MUTE_KEY !== 'playbox-double-dragon2-mute') throw new Error('mute key');
    if (JKICK.range <= COMBO_PUNCH[0].range) throw new Error('jkick range');
    if (GRAB_RANGE >= COMBO_PUNCH[0].range) throw new Error('grab closer than jab');
    if (THROW_HIT.stop < 0.06) throw new Error('throw stop');
    if (!STAGES[0].pits.length) throw new Error('heli pits');
    if (STAGES[1].pits.length || STAGES[2].pits.length) throw new Error('pits only heli');
    if (STAGES[0].pits[0][1] >= jumpAir() - 20) throw new Error('pit jumpable');
    let i, s;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.packs.length || !s.bossKind) throw new Error('stage ' + s.name);
    }
    if (STAGES[0].bossKind !== 'heli' || STAGES[2].bossKind !== 'don') throw new Error('crime-boss last');
    if (STAGES[0].theme !== 'heli' || STAGES[1].theme !== 'grove' || STAGES[2].theme !== 'manor') {
      throw new Error('themes');
    }
    (function pitsClearOfPacks() {
      const st = STAGES[0];
      let i, j, pack, pit, aL, aR;
      for (i = 0; i < st.packs.length; i++) {
        pack = st.packs[i];
        aL = pack.x - 90;
        aR = pack.gate + 40;
        for (j = 0; j < st.pits.length; j++) {
          pit = st.pits[j];
          if (pit[0] < aR && pit[0] + pit[1] > aL) throw new Error('pit in pack');
        }
      }
    }());
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
  const btnStage = document.getElementById('btn-stage');
  const btnCore = document.getElementById('btn-core');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeStage = document.getElementById('mode-stage');
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
  const grabLabel = document.getElementById('grab-label');
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

  const keys = { l: false, r: false, u: false, d: false, punch: false, kick: false };
  const punchEdge = { down: false, was: false };
  const kickEdge = { down: false, was: false };

  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const ghosts = [];

  const G = {
    mode: 'title',
    kind: 'stage',
    clock: 0,
    stage: 1,
    camX: 0,
    levelW: 2040,
    theme: 'heli',
    packs: [],
    pits: [],
    enemies: [],
    shots: [],
    player: null,
    boss: null,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
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
    goT: 0,
    arenaL: 0,
    arenaR: 640,
    safeX: 80,
    nextLife: LIFE_EVERY,
    why: '',
    won: false,
    hudDirty: true
  };

  function overlayOpen() {
    return overlay && !overlay.classList.contains('hidden');
  }
  function inputOk() {
    return G.mode === 'play' && !overlayOpen() && G.deadT <= 0;
  }
  function kickingSafe(p) {
    return p && p.act === 'jkick' && p.h > 10;
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
    kickWhoosh: function () {
      this.ensure();
      this.noise(0.12, 0.1, 700, 'highpass');
      this.beep(140, 0.1, 'sawtooth', 0.05, 60);
      this.beep(520, 0.08, 'triangle', 0.035, 280);
    },
    hit: function (combo, heavy) {
      this.ensure();
      const p = 1 + Math.min(6, combo) * 0.06;
      this.noise(0.12, heavy ? 0.2 : 0.14, 220, 'lowpass');
      this.beep(160 * p, 0.1, 'square', 0.08, 58);
      this.beep((heavy ? 880 : 640) * p, 0.07, 'triangle', 0.05, 380 * p);
      if (heavy) this.beep(1180 * p, 0.09, 'square', 0.04, 1540 * p);
    },
    grab: function () {
      this.ensure();
      this.beep(220, 0.06, 'square', 0.04, 140);
      this.noise(0.06, 0.06, 400, 'lowpass');
    },
    throw: function () {
      this.ensure();
      this.noise(0.1, 0.1, 900, 'highpass');
      this.beep(280, 0.12, 'sawtooth', 0.06, 90);
      this.beep(720, 0.08, 'square', 0.04, 420);
    },
    crash: function () {
      this.ensure();
      this.noise(0.2, 0.22, 150, 'lowpass');
      this.beep(90, 0.18, 'square', 0.08, 40);
      this.beep(220, 0.12, 'sawtooth', 0.05, 70);
    },
    blade: function () {
      this.ensure();
      this.noise(0.06, 0.06, 1800, 'highpass');
      this.beep(980, 0.05, 'square', 0.03, 520);
    },
    ko: function () {
      this.ensure();
      this.noise(0.24, 0.18, 140, 'lowpass');
      this.beep(120, 0.26, 'sine', 0.07, 48);
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
    },
    go: function () {
      this.ensure();
      this.beep(660, 0.07, 'square', 0.04, 880);
      this.beep(880, 0.1, 'triangle', 0.04, 1180);
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
  function kickCam(kx, ky) {
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
  function winKick() {
    if (REDUCE || !stageEl) return;
    stageEl.classList.remove('win-flash');
    void stageEl.offsetWidth;
    stageEl.classList.add('win-flash');
    setTimeout(function () { stageEl.classList.remove('win-flash'); }, 720);
  }
  function thumpKick() {
    if (REDUCE || !stageEl) return;
    stageEl.classList.remove('thump');
    void stageEl.offsetWidth;
    stageEl.classList.add('thump');
    setTimeout(function () { stageEl.classList.remove('thump'); }, 160);
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
      x: e.x, y: e.y, h: e.h || 0, face: e.face, t: 0.22,
      a: a || 0.35, kind: e.kind || 'player', act: e.act
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
    if (modeStage) modeStage.setAttribute('aria-pressed', kind === 'stage' ? 'true' : 'false');
    if (modeCore) modeCore.setAttribute('aria-pressed', kind === 'core' ? 'true' : 'false');
  }
  function poseLabel(p) {
    if (!p) return '徒手';
    if (p.grab) return '抓住';
    if (p.act === 'jkick') return '飞踢';
    if (p.act === 'punch' && COMBO_PUNCH[p.comboStep] && COMBO_PUNCH[p.comboStep].kick) return '回旋';
    return '徒手';
  }
  function syncHud() {
    const p = G.player;
    if (scoreEl) scoreEl.textContent = String(G.score | 0);
    if (bestEl) bestEl.textContent = String(G.best | 0);
    if (comboEl) comboEl.textContent = '×' + comboMul(G.combo);
    if (grabLabel) {
      const lab = poseLabel(p);
      grabLabel.textContent = lab;
      grabLabel.classList.toggle('grab', lab === '抓住');
      grabLabel.classList.toggle('kick', lab === '飞踢' || lab === '回旋');
      grabLabel.classList.toggle('hot', lab === '徒手');
    }
    if (tagLabel) {
      tagLabel.textContent = G.kind === 'core' ? '截核' : '双截2';
      tagLabel.classList.toggle('warn', G.kind === 'core');
    }
    if (stageLabel) {
      stageLabel.textContent = stageAt(G.stage - 1).name;
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
      x: x, y: y, h: 0,
      vx: 0, vy: 0, vh: 0,
      face: 1,
      act: 'idle',
      t: 0,
      step: 0,
      punch: 0,
      comboStep: 0,
      hit: false,
      punchBuf: 0,
      kickBuf: 0,
      stun: 0,
      grab: null,
      chainT: 0,
      run: 0,
      landT: 0
    };
  }
  function makeFoe(kind, x, y, scaleHp, scaleSpd) {
    const spec = FOES[kind];
    const hpMul = scaleHp || 1;
    const spdMul = scaleSpd || 1;
    return {
      id: uid++,
      kind: kind,
      spec: spec,
      x: x, y: y, h: 0,
      vx: 0, vy: 0, vh: 0,
      face: -1,
      hp: Math.round(spec.hp * hpMul),
      maxHp: Math.round(spec.hp * hpMul),
      spd: spec.spd * spdMul,
      act: 'idle',
      t: rand(0.1, spec.think),
      step: 0,
      punch: 0,
      hit: false,
      stun: 0,
      dead: false,
      deadT: 0,
      charge: 0,
      flyT: 0,
      thrower: false,
      slamHit: {},
      boss: !!spec.boss,
      flashT: 0,
      think: spec.think / spdMul,
      pack: -1,
      cool: 0
    };
  }
  function makeShot(x, y, face) {
    return {
      x: x, y: y, face: face,
      vx: face * 320,
      life: 0.78,
      kind: 'blade',
      from: 'foe'
    };
  }

  function lookOf(kind) {
    if (kind === 'player') {
      return { jacket: HOT, pants: BLU, hair: GOLD, skin: SKIN, accent: CYN, hairStyle: 'billy', size: 1 };
    }
    if (kind === 'thug') {
      return { jacket: [200, 70, 36], pants: [36, 32, 44], hair: MAG, skin: SKIN, accent: MAG, hairStyle: 'mohawk', size: 1 };
    }
    if (kind === 'kicker') {
      return { jacket: [24, 140, 150], pants: [20, 28, 48], hair: [16, 18, 22], skin: [210, 160, 128], accent: CYN, hairStyle: 'slick', size: 0.98 };
    }
    if (kind === 'axe') {
      return { jacket: [180, 90, 40], pants: [36, 28, 32], hair: [24, 18, 16], skin: [196, 140, 108], accent: GOLD, hairStyle: 'bald', size: 1.2 };
    }
    if (kind === 'blade') {
      return { jacket: [160, 40, 90], pants: [40, 24, 48], hair: [40, 18, 28], skin: [228, 170, 140], accent: MAG, hairStyle: 'pony', size: 0.96 };
    }
    if (kind === 'heli') {
      return { jacket: [200, 48, 40], pants: [28, 28, 36], hair: [24, 20, 18], skin: [196, 140, 108], accent: GOLD, hairStyle: 'helm', size: 1.22 };
    }
    if (kind === 'grove') {
      return { jacket: [36, 120, 64], pants: [20, 36, 28], hair: [18, 22, 16], skin: [210, 160, 120], accent: LEAF, hairStyle: 'slick', size: 1.14 };
    }
    return { jacket: [22, 18, 28], pants: [16, 14, 20], hair: [10, 10, 12], skin: [176, 128, 100], accent: GOLD, hairStyle: 'slick', size: 1.26 };
  }

  /* ---- world helpers ---- */
  function inPit(x) {
    let i, p;
    for (i = 0; i < G.pits.length; i++) {
      p = G.pits[i];
      if (x >= p[0] && x <= p[0] + p[1]) return true;
    }
    return false;
  }
  function clampBelt(e) {
    e.y = clamp(e.y, BELT_TOP, BELT_BOT);
    if (e.act === 'fall') return;
    e.x = clamp(e.x, G.arenaL + 18, G.arenaR - 18);
  }
  function facingToward(e, tx) {
    if (tx > e.x + 4) e.face = 1;
    else if (tx < e.x - 4) e.face = -1;
  }
  function depthHit(a, b) {
    return Math.abs(a.y - b.y) < 22;
  }
  function packAlive(packId) {
    let i, e, n = 0;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (e.pack === packId && !e.dead) n += 1;
    }
    return n;
  }

  /* ---- combat ---- */
  function hurtEnemy(e, dmg, kb, face, finisher, src) {
    if (e.dead || e.act === 'held') return;
    if (G.mode !== 'play') {
      e.hp -= dmg;
      e.stun = 0.22;
      e.act = e.hp <= 0 ? 'down' : 'hurt';
      e.t = e.hp <= 0 ? 0.45 : 0.22;
      e.vx = face * kb * 0.55;
      e.vh = 0;
      e.h = 0;
      e.flashT = 0.1;
      if (e.hp <= 0) {
        e.dead = true;
        e.deadT = 0.5;
        e.act = 'down';
      }
      return;
    }
    e.hp -= dmg;
    e.stun = finisher ? 0.62 : 0.22;
    e.act = e.hp <= 0 ? 'down' : 'hurt';
    e.t = e.hp <= 0 ? 0.55 : 0.3;
    e.vx = face * kb;
    e.vy = 0;
    e.vh = finisher ? 80 : 0;
    if (e.h > 0 && !finisher) e.vh = -40;
    e.charge = 0;
    e.flashT = 0.12;
    e.face = -face;
    e.flyT = 0;
    const mul = bumpCombo();
    const kill = Math.round(e.spec.score * mul);
    const chip = Math.max(12, Math.round((14 + dmg) * mul));
    if (e.hp <= 0) {
      e.dead = true;
      e.deadT = 0.64;
      e.act = 'down';
      bumpScore(kill);
      pop(e.x, e.y - 36 - e.h, '+' + kill, GOLD);
      burst(e.x, e.y - 18 - e.h, 22, e.kind === 'kicker' ? CYN : MAG, 210, 0.48);
      spark(e.x, e.y - 20 - e.h, GOLD, 10);
      ringAt(e.x, e.y - 12 - e.h, HOT);
      if (e.boss) {
        burst(e.x, e.y - 24, 36, GOLD, 260, 0.62);
        flash(GOLD, 0.55);
        audio.ko();
      }
    } else {
      bumpScore(chip);
      pop(e.x, e.y - 32 - e.h, '+' + chip, WHT);
    }
    G.hudDirty = true;
  }

  function crashPlayer(why, face) {
    const p = G.player;
    if (!p || G.invuln > 0 || kickingSafe(p) || G.deadT > 0) return;
    if (G.mode !== 'play') return;
    if (p.act === 'fall') return;
    loseLife(why || '被撞了', face);
  }

  function loseLife(why, face) {
    const p = G.player;
    G.why = why;
    G.deadT = DIE_T;
    G.lives -= 1;
    G.hudDirty = true;
    breakCombo();
    if (p) {
      if (p.grab) dropGrab(p);
      p.act = 'down';
      p.t = DIE_T;
      p.vh = 0;
      if (face) p.vx = face * 140;
    }
    audio.crash();
    audio.ko();
    dieKick();
    flash(HOT, 0.55);
    shake(12);
    if (p) {
      burst(p.x, p.y - 18 - (p.h || 0), 28, HOT, 240, 0.5);
      spark(p.x, p.y - 18 - (p.h || 0), GOLD, 12);
      ringAt(p.x, p.y - 10, MAG);
    }
    if (G.lives < 0) G.lives = 0;
  }

  function respawn() {
    const p = G.player;
    if (G.lives <= 0) {
      showOver(false);
      return;
    }
    if (!p) return;
    p.act = 'idle';
    p.t = 0;
    p.vx = 0;
    p.vh = 0;
    p.h = 0;
    p.stun = 0;
    p.punch = 0;
    p.comboStep = 0;
    p.grab = null;
    p.landT = 0;
    p.x = clamp(G.safeX, G.arenaL + 24, G.arenaR - 24);
    if (inPit(p.x)) p.x = G.arenaL + 40;
    G.deadT = 0;
    G.invuln = INVULN;
    G.hudDirty = true;
    toast('再上', false, true);
  }

  function dropGrab(p) {
    const e = p.grab;
    if (e && !e.dead) {
      e.act = 'hurt';
      e.t = 0.2;
      e.stun = 0.2;
    }
    p.grab = null;
    G.hudDirty = true;
  }

  function tryGrab(p) {
    if (p.h > 4) return false;
    let i, e, best = null, d, ad, bd = GRAB_RANGE + 8;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (e.dead || e.boss || e.act === 'fly' || e.act === 'held') continue;
      if (e.stun <= 0 && e.act !== 'hurt' && e.act !== 'down') continue;
      if (!depthHit(p, e)) continue;
      d = (e.x - p.x) * p.face;
      ad = Math.abs(e.x - p.x);
      if (ad > GRAB_RANGE + 6) continue;
      if (d < -8 && ad > 18) continue;
      if (ad < bd) { bd = ad; best = e; }
    }
    if (!best) return false;
    if (best.x >= p.x) p.face = 1;
    else p.face = -1;
    p.grab = best;
    p.act = 'grab';
    p.t = 0.12;
    best.act = 'held';
    best.vx = 0;
    best.h = 0;
    best.vh = 0;
    best.charge = 0;
    audio.grab();
    toast('抓住', false, true);
    G.hudDirty = true;
    return true;
  }

  function doThrow(p) {
    const e = p.grab;
    if (!e) return;
    p.grab = null;
    p.act = 'throw';
    p.t = 0.28;
    e.act = 'fly';
    e.flyT = 0.55;
    e.vx = p.face * 430;
    e.vy = 0;
    e.h = 8;
    e.face = -p.face;
    e.stun = 0.4;
    e.slamHit = {};
    e.thrower = true;
    audio.throw();
    hitStop(THROW_HIT.stop);
    shake(8);
    kickCam(p.face * 6, 2);
    thumpKick();
    burst(e.x, e.y - 16, 12, CYN, 160, 0.32);
    ghostAt(p, 0.4);
    G.hudDirty = true;
    if (G.mode === 'play') {
      const mul = bumpCombo();
      const n = Math.round(200 * mul);
      bumpScore(n);
      pop(e.x, e.y - 34, '+' + n, CYN);
    }
  }

  function meleeHits(p, atk) {
    const face = p.face;
    let i, e, d, n = 0;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (e.dead || e.act === 'held' || e.act === 'fly') continue;
      if (!depthHit(p, e)) continue;
      d = (e.x - p.x) * face;
      if (d < 4 || d > atk.range) continue;
      if (Math.abs((e.h || 0) - (p.h || 0)) > 36) continue;
      hurtEnemy(e, atk.dmg, atk.kb, face, !!atk.stun);
      n += 1;
    }
    return n;
  }

  function startPunch(p) {
    if (p.h > 6) return;
    if (p.grab) {
      doThrow(p);
      return;
    }
    if (p.chainT <= 0 && tryGrab(p)) return;
    let step = 0;
    if (p.chainT > 0) step = Math.min(2, p.comboStep + 1);
    p.comboStep = step;
    p.act = 'punch';
    p.t = COMBO_PUNCH[step].dur;
    p.hit = false;
    p.punch = 0;
    p.vx *= 0.3;
    if (COMBO_PUNCH[step].kick) audio.kickWhoosh();
    else audio.swing();
    G.hudDirty = true;
  }

  function startJumpKick(p) {
    if (p.h > 4 || p.act === 'jkick' || p.act === 'fall' || p.landT > 0) return;
    if (p.grab) {
      doThrow(p);
      return;
    }
    p.act = 'jkick';
    p.t = JKICK.dur;
    p.hit = false;
    p.h = 2;
    p.vh = JUMP_V;
    p.vx = p.face * WALK_X * 0.55;
    audio.kickWhoosh();
    ghostAt(p, 0.45);
    burst(p.x, p.y - 4, 6, CYN, 80, 0.22);
    G.hudDirty = true;
  }

  /* ---- player ---- */
  function tickPlayer(dt) {
    const p = G.player;
    if (!p) return;
    p.punchBuf = Math.max(0, p.punchBuf - dt);
    p.kickBuf = Math.max(0, p.kickBuf - dt);
    p.chainT = Math.max(0, p.chainT - dt);
    p.stun = Math.max(0, p.stun - dt);
    p.landT = Math.max(0, p.landT - dt);
    p.step += dt;

    if (G.deadT > 0) {
      G.deadT -= dt;
      p.act = p.act === 'fall' ? 'fall' : 'down';
      p.vx *= Math.max(0, 1 - dt * 6);
      p.x += p.vx * dt;
      if (p.act === 'fall') {
        p.vh -= GRAV * dt;
        p.h += p.vh * dt;
      }
      if (G.deadT <= 0) respawn();
      return;
    }

    if (G.invuln > 0) G.invuln = Math.max(0, G.invuln - dt);

    if (p.act === 'fall') {
      p.vh -= GRAV * 1.2 * dt;
      p.h += p.vh * dt;
      p.x += p.vx * dt * 0.3;
      if (p.h < -80) loseLife('坠坪了', 0);
      return;
    }

    if (p.act === 'throw') {
      p.t -= dt;
      if (p.t <= 0) p.act = 'idle';
      clampBelt(p);
      return;
    }

    if (p.act === 'jkick') {
      let mx = 0, my = 0;
      if (inputOk()) {
        if (keys.l) mx -= 1;
        if (keys.r) mx += 1;
        if (keys.u) my -= 1;
        if (keys.d) my += 1;
      }
      if (mx) p.face = mx > 0 ? 1 : -1;
      p.x += (mx || p.face) * WALK_X * AIR * dt;
      p.y += my * WALK_Y * 0.55 * dt;
      p.vh -= GRAV * dt;
      if (p.vh < -MAX_FALL) p.vh = -MAX_FALL;
      p.h += p.vh * dt;
      p.t -= dt;
      if ((G.clock * 22) % 1 < dt * 22) ghostAt(p, 0.28);
      if (!p.hit && p.h > 8) {
        const n = meleeHits(p, JKICK);
        if (n > 0) {
          p.hit = true;
          hitStop(JKICK.stop);
          shake(8);
          kickCam(p.face * 7, 3);
          burst(p.x + p.face * 26, p.y - 18 - p.h, 16, CYN, 200, 0.36);
          spark(p.x + p.face * 26, p.y - 18 - p.h, GOLD, 10);
          audio.hit(G.combo, true);
          boomKick();
        }
      }
      if (p.h <= 0) {
        p.h = 0;
        p.vh = 0;
        p.act = 'land';
        p.landT = 0.1;
        p.t = 0.1;
        if (inPit(p.x)) {
          p.act = 'fall';
          p.vh = -40;
          return;
        }
        G.safeX = p.x;
        thumpKick();
        G.hudDirty = true;
      }
      clampBelt(p);
      return;
    }

    if (p.act === 'land') {
      p.t -= dt;
      p.vx *= Math.max(0, 1 - dt * 8);
      p.x += p.vx * dt;
      clampBelt(p);
      if (p.t <= 0) p.act = 'idle';
      return;
    }

    if (p.act === 'punch') {
      p.t -= dt;
      const atk = COMBO_PUNCH[p.comboStep] || COMBO_PUNCH[0];
      if (!p.hit && p.t < atk.dur - atk.hit0 && p.t > atk.dur - atk.hit1) {
        const n = meleeHits(p, atk);
        p.hit = true;
        if (n > 0) {
          hitStop(atk.stop);
          shake(atk.stun ? 8 : 5);
          kickCam(p.face * (atk.stun ? 6 : 4), 2);
          burst(p.x + p.face * 22, p.y - 16, atk.stun ? 14 : 8, atk.kick ? CYN : HOT, 150, 0.3);
          spark(p.x + p.face * 22, p.y - 16, GOLD, atk.stun ? 8 : 4);
          audio.hit(G.combo, !!atk.stun);
        }
      }
      if (p.t <= 0) {
        p.chainT = 0.26;
        p.act = 'idle';
        G.hudDirty = true;
        if (inputOk() && p.kickBuf > 0) {
          p.kickBuf = 0;
          startJumpKick(p);
          return;
        }
      }
      clampBelt(p);
      return;
    }

    if (p.grab) {
      const e = p.grab;
      if (!e || e.dead) {
        p.grab = null;
        G.hudDirty = true;
      } else {
        let mx = 0, my = 0;
        if (inputOk()) {
          if (keys.l) mx -= 1;
          if (keys.r) mx += 1;
          if (keys.u) my -= 1;
          if (keys.d) my += 1;
        }
        if (mx) p.face = mx > 0 ? 1 : -1;
        p.x += mx * WALK_X * 0.55 * dt;
        p.y += my * WALK_Y * 0.55 * dt;
        clampBelt(p);
        e.x = p.x + p.face * 16;
        e.y = p.y;
        e.h = 0;
        e.act = 'held';
        e.face = -p.face;
        p.act = 'grab';
        p.run = Math.abs(mx) + Math.abs(my);
        if (p.run) p.step += dt * 1.4;
        if (inputOk() && (p.punchBuf > 0 || p.kickBuf > 0)) {
          p.punchBuf = 0;
          p.kickBuf = 0;
          doThrow(p);
          return;
        }
        return;
      }
    }

    let mx = 0, my = 0;
    if (inputOk()) {
      if (keys.l) mx -= 1;
      if (keys.r) mx += 1;
      if (keys.u) my -= 1;
      if (keys.d) my += 1;
    }
    if (mx) p.face = mx > 0 ? 1 : -1;
    const mag = hypot(mx, my) || 1;
    p.x += (mx / mag) * WALK_X * dt;
    p.y += (my / mag) * WALK_Y * dt;
    p.act = (mx || my) ? 'walk' : 'idle';
    if (p.act === 'walk') p.step += dt * 2.2;
    p.h = 0;
    p.vh = 0;
    clampBelt(p);

    if (p.h <= 0 && !inPit(p.x)) G.safeX = p.x;
    if (inPit(p.x) && p.h <= 0) {
      p.act = 'fall';
      p.vh = -30;
      return;
    }

    if (inputOk() && p.kickBuf > 0 && p.landT <= 0) {
      p.kickBuf = 0;
      startJumpKick(p);
      return;
    }
    if (inputOk() && p.punchBuf > 0) {
      p.punchBuf = 0;
      startPunch(p);
    }
  }

  /* ---- enemies ---- */
  function tickFly(e, dt) {
    e.flyT -= dt;
    e.x += e.vx * dt;
    const wallL = G.arenaL + 18;
    const wallR = G.arenaR - 18;
    if (e.x <= wallL || e.x >= wallR) {
      e.x = clamp(e.x, wallL, wallR);
      crashFoe(e);
      return;
    }
    if (inPit(e.x) && e.h <= 2) {
      crashFoe(e);
      return;
    }
    let i, o, d;
    for (i = 0; i < G.enemies.length; i++) {
      o = G.enemies[i];
      if (o === e || o.dead || o.act === 'held' || o.act === 'fly') continue;
      if (!depthHit(e, o)) continue;
      d = Math.abs(o.x - e.x);
      if (d > 22) continue;
      if (e.slamHit[o.id]) continue;
      e.slamHit[o.id] = 1;
      hurtEnemy(o, SLAM_HIT.dmg, SLAM_HIT.kb, e.vx > 0 ? 1 : -1, true, 'throw');
      hitStop(SLAM_HIT.stop);
      burst(o.x, o.y - 16, 12, GOLD, 170, 0.32);
      audio.hit(G.combo, true);
      if (G.mode === 'play') {
        const mul = comboMul(G.combo);
        const n = Math.round(120 * mul);
        bumpScore(n);
        pop(o.x, o.y - 30, '+' + n, GOLD);
      }
    }
    if (e.flyT <= 0) {
      e.act = 'hurt';
      e.t = 0.28;
      e.stun = 0.4;
      e.vx *= 0.2;
      e.h = 0;
      e.thrower = false;
    }
  }

  function crashFoe(e) {
    e.act = 'down';
    e.t = 0.45;
    e.flyT = 0;
    e.vx = 0;
    e.h = 0;
    e.thrower = false;
    e.stun = 0.5;
    audio.crash();
    hitStop(0.07);
    shake(10);
    flash(HOT, 0.22);
    burst(e.x, e.y - 14, 20, HOT, 210, 0.4);
    spark(e.x, e.y - 14, GOLD, 10);
    ringAt(e.x, e.y - 8, HOT);
    if (G.mode === 'play' && !e.dead) {
      hurtEnemy(e, 12, 40, e.face, true, 'throw');
    }
  }

  function foePunchHit(e) {
    const p = G.player;
    if (!p || G.deadT > 0) return;
    if (!depthHit(e, p)) return;
    const d = (p.x - e.x) * e.face;
    if (d < 4 || d > e.spec.range) return;
    if (Math.abs((p.h || 0) - (e.h || 0)) > 28) return;
    crashPlayer('被' + e.spec.name + '打中了', e.face);
  }

  function foeChargeHit(e) {
    const p = G.player;
    if (!p || G.deadT > 0) return;
    if (!depthHit(e, p)) return;
    if (Math.abs(p.x - e.x) > 18) return;
    if (p.h > 22) return;
    crashPlayer('被' + e.spec.name + '撞了', e.vx > 0 ? 1 : -1);
  }

  function foeKickHit(e) {
    const p = G.player;
    if (!p || G.deadT > 0) return;
    if (!depthHit(e, p)) return;
    const d = (p.x - e.x) * e.face;
    if (d < 2 || d > 40) return;
    if (Math.abs((p.h || 0) - (e.h || 0)) > 30) return;
    crashPlayer('被飞踢了', e.face);
  }

  function tickFoe(e, dt) {
    if (e.dead) {
      e.deadT -= dt;
      e.act = 'down';
      e.vx *= Math.max(0, 1 - dt * 5);
      e.x += e.vx * dt;
      e.h = Math.max(0, e.h + e.vh * dt);
      e.vh -= GRAV * dt;
      return;
    }
    e.flashT = Math.max(0, e.flashT - dt);
    e.stun = Math.max(0, e.stun - dt);
    e.cool = Math.max(0, e.cool - dt);
    e.step += dt;

    if (e.act === 'held') return;
    if (e.act === 'fly') {
      tickFly(e, dt);
      return;
    }
    if (e.act === 'hurt' || e.act === 'down') {
      e.t -= dt;
      e.x += e.vx * dt;
      e.vx *= Math.max(0, 1 - dt * 5);
      e.h = Math.max(0, e.h + e.vh * dt);
      e.vh -= GRAV * dt;
      if (e.h <= 0) { e.h = 0; e.vh = 0; }
      clampBelt(e);
      if (e.t <= 0) {
        e.act = 'idle';
        e.t = e.think;
      }
      return;
    }
    if (e.act === 'jkick') {
      e.t -= dt;
      e.x += e.vx * dt;
      e.vh -= GRAV * dt;
      e.h += e.vh * dt;
      if (!e.hit && e.h > 10) {
        e.hit = true;
        foeKickHit(e);
      }
      if (e.h <= 0) {
        e.h = 0;
        e.vh = 0;
        e.act = 'idle';
        e.t = e.think;
        e.vx = 0;
      }
      clampBelt(e);
      return;
    }
    if (e.act === 'punch') {
      e.t -= dt;
      if (!e.hit && e.t < e.spec.punchDur * 0.55) {
        e.hit = true;
        foePunchHit(e);
      }
      if (e.t <= 0) {
        e.act = 'idle';
        e.t = e.think;
      }
      clampBelt(e);
      return;
    }
    if (e.act === 'charge') {
      e.t -= dt;
      e.x += e.vx * dt;
      foeChargeHit(e);
      clampBelt(e);
      if (e.t <= 0 || e.x <= G.arenaL + 20 || e.x >= G.arenaR - 20) {
        e.act = 'idle';
        e.t = e.think;
        e.vx = 0;
      }
      return;
    }
    if (e.act === 'throw') {
      e.t -= dt;
      if (!e.hit && e.t < 0.18) {
        e.hit = true;
        G.shots.push(makeShot(e.x + e.face * 16, e.y, e.face));
        audio.blade();
      }
      if (e.t <= 0) {
        e.act = 'idle';
        e.t = e.think * 1.2;
      }
      return;
    }

    const p = G.player;
    if (!p) return;
    facingToward(e, p.x);
    const dx = p.x - e.x;
    const dy = p.y - e.y;
    const dist = hypot(dx, dy);
    e.t -= dt;

    const canCharge = e.spec.charge && Math.abs(dy) < 14 && Math.abs(dx) > 50 && e.cool <= 0;
    const canThrow = e.spec.thrower && Math.abs(dy) < 18 && Math.abs(dx) > 48 && Math.abs(dx) < e.spec.range && e.cool <= 0;
    const canJkick = e.spec.jkick && Math.abs(dy) < 16 && Math.abs(dx) > 36 && Math.abs(dx) < 90 && e.cool <= 0 && p.h < 40;
    const meleeR = e.spec.thrower ? 32 : e.spec.range;
    const inMelee = Math.abs(dx) < meleeR && Math.abs(dy) < 16 && p.h < 20;

    if (e.t <= 0) {
      if (e.kind === 'don' && e.cool <= 0) {
        let guards = 0;
        let gi;
        for (gi = 0; gi < G.enemies.length; gi++) {
          if (!G.enemies[gi].dead && G.enemies[gi].pack === -3) guards += 1;
        }
        if (guards < (denser() ? 3 : 2)) {
          const gk = Math.random() < 0.5 ? 'kicker' : 'thug';
          const ge = makeFoe(gk, e.x - e.face * 70, clamp(e.y + rand(-18, 18), BELT_TOP, BELT_BOT), denser() ? 1.18 : 1, denser() ? 1.14 : 1);
          ge.pack = -3;
          G.enemies.push(ge);
          e.cool = 2.6;
          e.t = e.think;
          if (G.mode === 'play') toast('打手', true, false);
          return;
        }
      }
      if (canJkick) {
        e.act = 'jkick';
        e.h = 2;
        e.vh = 420;
        e.vx = e.face * e.spd * 1.55;
        e.hit = false;
        e.t = 0.7;
        e.cool = 1.5;
        return;
      }
      if (canCharge) {
        e.act = 'charge';
        e.t = 0.55;
        e.vx = e.face * e.spd * 2.1;
        e.cool = 1.6;
        return;
      }
      if (canThrow) {
        e.act = 'throw';
        e.t = 0.36;
        e.hit = false;
        e.cool = 1.35;
        return;
      }
      if (inMelee) {
        e.act = 'punch';
        e.t = e.spec.punchDur;
        e.hit = false;
        return;
      }
      e.t = e.think;
    }

    let spd = e.spd;
    if (e.spec.heavy) spd *= 0.85;
    if (inPit(e.x + Math.sign(dx) * 18) && Math.abs(dx) > 20) {
      e.y += (dy > 0 ? 1 : -1) * spd * 0.5 * dt;
      e.act = 'walk';
    } else if (dist > 18) {
      e.x += (dx / dist) * spd * dt;
      e.y += (dy / dist) * spd * 0.72 * dt;
      e.act = 'walk';
    } else {
      e.act = 'idle';
    }
    if (inPit(e.x)) {
      e.x += (inPit(e.x - 8) ? 1 : -1) * spd * dt;
    }
    clampBelt(e);
  }

  function tickShots(dt) {
    let i, s, p;
    for (i = G.shots.length - 1; i >= 0; i--) {
      s = G.shots[i];
      s.life -= dt;
      s.x += s.vx * dt;
      if (s.life <= 0 || s.x < G.camX - 40 || s.x > G.camX + VW + 40) {
        G.shots.splice(i, 1);
        continue;
      }
      p = G.player;
      if (!p || G.deadT > 0 || G.invuln > 0 || kickingSafe(p)) continue;
      if (Math.abs(s.y - p.y) > 12) continue;
      if (Math.abs(s.x - p.x) > 12) continue;
      if (p.h > 24) continue;
      G.shots.splice(i, 1);
      burst(p.x, p.y - 16, 8, CYN, 130, 0.24);
      crashPlayer('中飞刃了', s.face);
    }
  }

  /* ---- stage flow ---- */
  function extraFoes(list) {
    if (!denser()) return list;
    const out = list.slice();
    let i, f, y;
    for (i = 0; i < list.length; i++) {
      if (out.length >= list.length + 2) break;
      f = list[i];
      y = clamp(f[2] + (i % 2 === 0 ? 14 : -14), BELT_TOP + 8, BELT_BOT - 8);
      out.push([f[0] === 'blade' ? 'thug' : f[0], f[1] + 36, y]);
    }
    return out;
  }

  function spawnPack(pack, idx) {
    if (pack.spawned) return;
    pack.spawned = true;
    const hpMul = denser() ? 1.18 : 1;
    const spdMul = denser() ? 1.14 : 1;
    const list = extraFoes(pack.foes);
    let i, f, e;
    for (i = 0; i < list.length; i++) {
      f = list[i];
      e = makeFoe(f[0], f[1], f[2], hpMul, spdMul);
      e.pack = idx;
      G.enemies.push(e);
    }
    G.arenaR = Math.min(G.levelW - 8, pack.gate + 40);
    G.arenaL = Math.max(0, pack.x - 80);
    toast('来了', false, false);
  }

  function spawnBoss() {
    if (G.boss) return;
    const st = stageAt(G.stage - 1);
    const hpMul = denser() ? 1.2 : 1;
    const spdMul = denser() ? 1.12 : 1;
    const x = G.levelW - 160;
    const e = makeFoe(st.bossKind, x, 270, hpMul, spdMul);
    e.pack = -2;
    G.enemies.push(e);
    G.boss = e;
    G.arenaL = Math.max(0, x - 280);
    G.arenaR = G.levelW - 8;
    toast(st.boss + ' 来了', true, false);
    audio.go();
    G.hudDirty = true;
  }

  function tickPacks() {
    const p = G.player;
    if (!p) return;
    let i, pack, locked = false;
    for (i = 0; i < G.packs.length; i++) {
      pack = G.packs[i];
      if (!pack.spawned && p.x > pack.x - 40) spawnPack(pack, i);
      if (pack.spawned && !pack.cleared) {
        if (packAlive(i) <= 0) {
          pack.cleared = true;
          G.goT = 1.1;
          audio.go();
          toast('GO →', false, true);
        } else {
          locked = true;
          G.arenaR = Math.min(G.levelW - 8, pack.gate + 40);
          G.arenaL = Math.max(0, pack.x - 90);
        }
      }
    }
    if (!locked && !G.boss) {
      G.arenaL = 0;
      G.arenaR = G.levelW - 8;
      if (p.x > G.levelW - 360) spawnBoss();
    }
    if (G.boss && !G.boss.dead) {
      G.arenaL = Math.max(0, G.boss.x - 300);
      G.arenaR = Math.min(G.levelW - 8, G.boss.x + 220);
    }
  }

  function tickCamera(dt) {
    const p = G.player;
    if (!p) return;
    let target = p.x - 180;
    target = clamp(target, 0, Math.max(0, G.levelW - VW));
    if (G.boss && !G.boss.dead) {
      const mid = (G.arenaL + G.arenaR) * 0.5 - VW * 0.5;
      target = lerp(target, mid, 0.45);
    }
    G.camX = lerp(G.camX, target, 1 - Math.pow(0.001, dt));
    G.camX = clamp(G.camX, 0, Math.max(0, G.levelW - VW));
  }

  function loadStage(n, keep) {
    const st = stageAt(n - 1);
    G.stage = n;
    G.theme = st.theme;
    G.levelW = st.w;
    G.pits = (st.pits || []).map(function (p) { return [p[0], p[1]]; });
    G.packs = st.packs.map(function (pk) {
      return { x: pk.x, gate: pk.gate, foes: pk.foes, spawned: false, cleared: false };
    });
    G.enemies = [];
    G.shots = [];
    G.boss = null;
    G.arenaL = 0;
    G.arenaR = 640;
    G.camX = 0;
    G.intro = 0.95;
    G.clearT = 0;
    G.goT = 0;
    const px = keep && G.player ? 70 : 80;
    const py = keep && G.player ? G.player.y : 272;
    G.player = makePlayer(px, py);
    G.safeX = px;
    G.invuln = keep ? 0.6 : 0;
    G.deadT = 0;
    G.hudDirty = true;
    resetFx();
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      if (G.mode === 'play') {
        bumpScore(2000 * G.stage);
        bumpScore(8000);
      }
      showOver(true);
      return;
    }
    bumpScore(2000 * G.stage);
    toast(stageAt(G.stage - 1).name + ' 清了', false, true);
    G.stage += 1;
    loadStage(G.stage, true);
    audio.go();
  }

  function tickClear(dt) {
    if (!G.boss || !G.boss.dead || G.clearT < 0) return;
    if (G.clearT === 0) G.clearT = 1.35;
    G.clearT -= dt;
    if (G.clearT <= 0) {
      G.clearT = -1;
      nextStage();
    }
  }

  /* ---- title / run ---- */
  function showTitle() {
    G.mode = 'title';
    G.kind = G.kind || 'stage';
    G.stage = 1;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.lives = LIVES;
    G.won = false;
    G.why = '';
    setModes(G.kind);
    loadStage(1, false);
    G.arenaR = G.levelW - 8;
    G.player.x = 140;
    G.player.y = 272;
    G.pits = [];
    const d1 = makeFoe('thug', 280, 260, 1, 1);
    const d2 = makeFoe('kicker', 360, 300, 1, 1);
    G.enemies = [d1, d2];
    panel.classList.remove('win', 'lose');
    ovKicker.textContent = 'DD2';
    ovTitle.textContent = '双截2';
    ovLead.innerHTML = '侧向清场。出拳连击，飞踢砸人，贴近抓住再甩出去。<br />被打中或坠坪即撞击丢命。打穿三关，最后是影枭。';
    ovOps.textContent = OPS;
    ovStart.classList.remove('gone');
    ovEnd.classList.add('gone');
    showOverlay();
    setHint('走出拳 · 飞踢砸人 · 抓住甩 · 撞击丢命');
    G.hudDirty = true;
    try { btnStage.focus(); } catch (e) { /* ignore */ }
  }

  function startRun(kind) {
    G.kind = kind === 'core' ? 'core' : 'stage';
    setModes(G.kind);
    G.mode = 'play';
    G.stage = 1;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.lives = LIVES;
    G.nextLife = LIFE_EVERY;
    G.won = false;
    G.why = '';
    G.deadT = 0;
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast(G.kind === 'core' ? '截核' : '双截2', false, G.kind === 'core');
    setHint(G.kind === 'core' ? '截核更密 · 空格拳 · Shift 飞踢' : '空格出拳 · Shift 飞踢 · 抓住甩');
    G.hudDirty = true;
    try { canvas.focus(); } catch (e) { /* ignore */ }
  }

  function showOver(win) {
    G.mode = 'over';
    G.won = win;
    persistBest();
    panel.classList.toggle('win', win);
    panel.classList.toggle('lose', !win);
    ovKicker.textContent = win ? 'CLEAR' : 'DOWN';
    ovTitle.textContent = win
      ? (G.kind === 'core' ? '截核清场' : '罪府清了')
      : (G.why || '被撞了');
    const extra = '第 ' + G.stage + ' 关 · ';
    ovLead.textContent = extra + G.score + ' 分 · 连击最高 ×' + G.maxCombo + (G.score >= G.best && G.score > 0 ? ' · 新纪录' : '');
    ovOps.textContent = 'R 或「再来」重开 · 顶栏重开随时可用';
    ovStart.classList.add('gone');
    ovEnd.classList.remove('gone');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = win ? '截核' : '换模式';
    showEndOverlay();
    if (win) {
      audio.win();
      winKick();
    } else {
      audio.over();
    }
    setHint('R 再来 · 换模式回标题', win ? 'hot' : 'warn');
    try { ovAgain.focus(); } catch (e) { /* ignore */ }
    G.hudDirty = true;
  }

  function retry() {
    audio.ui();
    if (hintEl) hintEl.classList.remove('warn', 'hot');
    if (G.mode === 'title') startRun('stage');
    else startRun(G.kind);
  }

  function tickDemo(dt) {
    const p = G.player;
    if (!p) return;
    p.step += dt;
    if (p.act === 'jkick' || p.act === 'punch' || p.act === 'throw' || p.act === 'land' || p.grab) {
      tickPlayer(dt);
    } else {
      p.face = 1;
      p.x += 40 * dt;
      if (p.x > 430) p.x = 90;
      p.y = 272 + Math.sin(G.clock * 1.4) * 6;
      p.act = 'walk';
      const beat = (G.clock * 0.9) | 0;
      const prev = ((G.clock - dt) * 0.9) | 0;
      if (beat !== prev) {
        if (beat % 3 === 0) startJumpKick(p);
        else {
          p.punchBuf = 0.1;
          startPunch(p);
        }
      }
    }
    let i;
    for (i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.dead && e.deadT <= 0) {
        G.enemies[i] = makeFoe(e.kind, 380 + i * 70, 250 + i * 30, 1, 1);
        continue;
      }
      tickFoe(e, dt);
    }
    G.camX = lerp(G.camX, clamp(p.x - 180, 0, G.levelW - VW), 0.08);
  }

  function tick(dt) {
    G.clock += dt;
    if (G.goT > 0) G.goT -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    if (G.mode === 'title') {
      tickDemo(dt);
      return;
    }
    if (G.mode !== 'play') return;
    tickPlayer(dt);
    let i;
    for (i = 0; i < G.enemies.length; i++) tickFoe(G.enemies[i], dt);
    for (i = G.enemies.length - 1; i >= 0; i--) {
      if (G.enemies[i].dead && G.enemies[i].deadT <= 0) G.enemies.splice(i, 1);
    }
    tickShots(dt);
    tickPacks();
    tickCamera(dt);
    tickClear(dt);
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
    let g;
    if (G.theme === 'grove') {
      g = ctx.createLinearGradient(0, oy, 0, oy + 210 * scale);
      g.addColorStop(0, '#06140c');
      g.addColorStop(1, '#102418');
    } else if (G.theme === 'manor') {
      g = ctx.createLinearGradient(0, oy, 0, oy + 210 * scale);
      g.addColorStop(0, '#14060c');
      g.addColorStop(1, '#241018');
    } else {
      g = ctx.createLinearGradient(0, oy, 0, oy + 210 * scale);
      g.addColorStop(0, '#10060a');
      g.addColorStop(1, '#1c1010');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
    ctx.fillStyle = rgba(GOLD, G.theme === 'manor' ? 0.12 : 0.22);
    ctx.beginPath();
    ctx.arc(wx(G.camX * 0.16 + 520), wy(42), 16 * scale, 0, TAU);
    ctx.fill();
  }

  function drawBack() {
    const start = Math.floor((G.camX * 0.32) / 70) - 1;
    let i, hsh, bx, bw, bh, win, c;
    if (G.theme === 'heli') {
      ctx.fillStyle = '#1a1210';
      ctx.fillRect(ox, wy(150), VW * scale, 70 * scale);
      for (i = start; i < start + 14; i++) {
        bx = i * 90 - G.camX * 0.28;
        ctx.fillStyle = rgba(HOT, 0.08);
        ctx.fillRect(wx(G.camX + bx), wy(156), 40 * scale, 8 * scale);
        ctx.fillStyle = rgba(GOLD, 0.16 + 0.1 * Math.sin(G.clock * 3 + i));
        ctx.beginPath();
        ctx.arc(wx(G.camX + bx + 20), wy(160), 5 * scale, 0, TAU);
        ctx.fill();
      }
      const hx = 420 - G.camX * 0.22;
      ctx.fillStyle = '#2a3038';
      ctx.beginPath();
      ctx.ellipse(wx(G.camX + hx), wy(88), 38 * scale, 8 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(wx(G.camX + hx - 10), wy(88), 20 * scale, 28 * scale);
      ctx.fillStyle = rgba(CYN, 0.25);
      ctx.fillRect(wx(G.camX + hx - 6), wy(94), 12 * scale, 6 * scale);
    } else if (G.theme === 'grove') {
      for (i = start; i < start + 16; i++) {
        hsh = hash2(i * 19 + 7);
        bx = i * 64 - G.camX * 0.36;
        bw = 18 + hsh * 16;
        bh = 90 + hsh * 70;
        ctx.fillStyle = '#0c1c12';
        ctx.fillRect(wx(G.camX + bx + 8), wy(210 - 30), 6 * scale, 30 * scale);
        ctx.fillStyle = '#12301c';
        ctx.beginPath();
        ctx.ellipse(wx(G.camX + bx + 11), wy(210 - 30 - bh * 0.35), bw * scale, bh * 0.4 * scale, 0, 0, TAU);
        ctx.fill();
        if (hsh > 0.55) {
          ctx.fillStyle = rgba(LEAF, 0.18);
          ctx.beginPath();
          ctx.arc(wx(G.camX + bx + 14), wy(210 - 40 - bh * 0.2), 4 * scale, 0, TAU);
          ctx.fill();
        }
      }
    } else {
      for (i = start; i < start + 14; i++) {
        hsh = hash2(i * 13 + 11);
        bx = i * 78 - G.camX * 0.3;
        bw = 52 + hsh * 22;
        bh = 88 + hsh * 70;
        ctx.fillStyle = '#16080c';
        ctx.fillRect(wx(G.camX + bx), wy(210 - bh), bw * scale, bh * scale);
        ctx.fillStyle = rgba(GOLD, 0.12);
        ctx.fillRect(wx(G.camX + bx + 8), wy(210 - bh), 4 * scale, bh * scale);
        for (win = 0; win < 8; win++) {
          if (hash2(i * 90 + win) < 0.62) {
            c = hash2(i + win * 3) < 0.4 ? GOLD : MAG;
            ctx.fillStyle = rgba(c, 0.32 + 0.22 * Math.sin(G.clock * 2 + win));
            ctx.fillRect(
              wx(G.camX + bx + 10 + (win % 3) * 14),
              wy(210 - bh + 12 + Math.floor(win / 3) * 18),
              8 * scale, 10 * scale
            );
          }
        }
      }
      ctx.fillStyle = 'rgba(40, 16, 12, 0.35)';
      ctx.fillRect(ox, wy(168), VW * scale, 44 * scale);
      ctx.fillStyle = rgba(GOLD, 0.12);
      ctx.fillRect(ox, wy(168), VW * scale, 3 * scale);
    }
  }

  function drawStreet() {
    const g = ctx.createLinearGradient(0, wy(BELT_TOP - 18), 0, wy(VH));
    g.addColorStop(0, G.theme === 'manor' ? '#1c1014' : G.theme === 'grove' ? '#142018' : '#1a1410');
    g.addColorStop(0.35, '#121016');
    g.addColorStop(1, '#0a0608');
    ctx.fillStyle = g;
    ctx.fillRect(ox, wy(BELT_TOP - 18), VW * scale, (VH - (BELT_TOP - 18)) * scale);

    ctx.fillStyle = G.theme === 'heli' ? '#2a2218' : G.theme === 'grove' ? '#1c2a1c' : '#2a1a14';
    ctx.fillRect(ox, wy(BELT_TOP - 18), VW * scale, 8 * scale);
    ctx.fillStyle = rgba(HOT, 0.22);
    ctx.fillRect(ox, wy(BELT_TOP - 12), VW * scale, 2 * scale);

    ctx.fillStyle = '#0c0810';
    ctx.fillRect(ox, wy(BELT_BOT + 6), VW * scale, 8 * scale);
    ctx.fillStyle = rgba(HOT, 0.3);
    ctx.fillRect(ox, wy(BELT_BOT + 4), VW * scale, 2 * scale);

    const x0 = Math.floor(G.camX / 80) * 80;
    let x, i, pit;
    if (G.theme === 'heli') {
      ctx.strokeStyle = 'rgba(255, 227, 107, 0.18)';
      ctx.lineWidth = 2 * scale;
      ctx.setLineDash([10 * scale, 14 * scale]);
      ctx.beginPath();
      ctx.moveTo(wx(x0 - 80), wy((BELT_TOP + BELT_BOT) * 0.5));
      ctx.lineTo(wx(x0 + VW + 80), wy((BELT_TOP + BELT_BOT) * 0.5));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 2 * scale;
      for (x = x0; x < G.camX + VW + 80; x += 220) {
        ctx.beginPath();
        ctx.ellipse(wx(x + 40), wy((BELT_TOP + BELT_BOT) * 0.5), 34 * scale, 18 * scale, 0, 0, TAU);
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (x = x0; x < G.camX + VW + 40; x += 90) {
        ctx.beginPath();
        ctx.moveTo(wx(x), wy(BELT_TOP));
        ctx.lineTo(wx(x + 40), wy(BELT_BOT));
        ctx.stroke();
      }
    }

    for (i = 0; i < G.pits.length; i++) {
      pit = G.pits[i];
      ctx.fillStyle = '#050204';
      ctx.fillRect(wx(pit[0]), wy(BELT_TOP - 8), pit[1] * scale, (BELT_BOT - BELT_TOP + 22) * scale);
      ctx.strokeStyle = rgba(GOLD, 0.45);
      ctx.lineWidth = 2 * scale;
      ctx.setLineDash([6 * scale, 6 * scale]);
      ctx.strokeRect(wx(pit[0]), wy(BELT_TOP - 8), pit[1] * scale, (BELT_BOT - BELT_TOP + 22) * scale);
      ctx.setLineDash([]);
      ctx.fillStyle = rgba(HOT, 0.12);
      ctx.fillRect(wx(pit[0]), wy(BELT_BOT), pit[1] * scale, 10 * scale);
    }

    for (x = x0; x < G.camX + VW + 60; x += 160) {
      const lampX = x + 40;
      if (inPit(lampX)) continue;
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

  function drawShot(s) {
    const x = wx(s.x);
    const y = wy(s.y - 18);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s.face, 1);
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.beginPath();
    ctx.moveTo(10 * scale, 0);
    ctx.lineTo(-6 * scale, 3 * scale);
    ctx.lineTo(-6 * scale, -3 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.85);
    ctx.fillRect(-10 * scale, -2 * scale, 5 * scale, 3 * scale);
    ctx.restore();
  }

  function drawFighter(e, look, opts) {
    const s = scale * look.size;
    const x = wx(e.x);
    const y = wy(e.y - (e.h || 0));
    const face = e.face || 1;
    const blink = opts && opts.blink && ((G.clock * 16) | 0) % 2 === 0;
    if (blink) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(face, 1);

    ctx.fillStyle = 'rgba(0,0,0,' + (0.35 + ((e.h || 0) > 0 ? 0.08 : 0)) + ')';
    ctx.beginPath();
    ctx.ellipse(0, (e.h || 0) * scale, 11 * s, 4 * s, 0, 0, TAU);
    ctx.fill();

    const walk = (e.act === 'walk' || e.act === 'charge') ? Math.sin(e.step * 2.2) : 0;
    const punch = e.act === 'punch' || e.act === 'throw';
    const jkick = e.act === 'jkick';
    const hurt = e.act === 'hurt';
    const down = e.act === 'down' || e.act === 'fall';
    const grab = e.act === 'grab' || e.act === 'held';
    const fly = e.act === 'fly';
    const finKick = punch && e.kind === 'player' && e.comboStep === 2;
    let bodyY = -16 * s;
    if (down) {
      ctx.rotate(-1.15);
      bodyY = -8 * s;
    } else if (fly) {
      ctx.rotate(-0.9);
      bodyY = -10 * s;
    } else if (jkick) {
      ctx.rotate(-0.95);
      bodyY = -20 * s;
    } else if (finKick) {
      ctx.rotate(-0.55);
      bodyY = -18 * s;
    } else if (hurt) {
      ctx.rotate(-0.18);
    } else if (grab && e.kind === 'player') {
      ctx.rotate(-0.08);
    }

    if (e.flashT > 0) ctx.globalAlpha = 0.55 + 0.45 * Math.sin(G.clock * 40);

    ctx.fillStyle = rgba(look.pants, 1);
    if (!down && !fly) {
      if (jkick || finKick) {
        ctx.fillRect(-6 * s, -12 * s, 4.2 * s, 10 * s);
        ctx.fillRect(6 * s, -8 * s, 16 * s, 4.2 * s);
        ctx.fillStyle = rgba(CYN, 0.7);
        ctx.fillRect(20 * s, -9 * s, 6 * s, 5 * s);
      } else {
        ctx.fillRect(-6 * s + walk * 3 * s, -10 * s, 4.2 * s, 12 * s);
        ctx.fillRect(1.4 * s - walk * 3 * s, -10 * s, 4.2 * s, 12 * s);
      }
    } else {
      ctx.fillRect(-10 * s, -6 * s, 14 * s, 5 * s);
    }
    ctx.fillStyle = '#d8dce8';
    if (!down && !fly && !jkick && !finKick) {
      ctx.fillRect(-6.2 * s + walk * 3 * s, 0, 4.4 * s, 3 * s);
      ctx.fillRect(1.2 * s - walk * 3 * s, 0, 4.4 * s, 3 * s);
    }

    ctx.fillStyle = rgba(look.jacket, 1);
    rr(-8 * s, bodyY - 2 * s, 16 * s, 14 * s, 3 * s);
    ctx.fill();
    ctx.fillStyle = rgba(look.accent, 0.7);
    ctx.fillRect(-2 * s, bodyY, 4 * s, 10 * s);

    const armY = bodyY + 2 * s;
    ctx.fillStyle = rgba(look.skin, 1);
    if (punch && !finKick) {
      ctx.fillRect(6 * s, armY - 3 * s, 14 * s, 4.2 * s);
      ctx.fillRect(-10 * s, armY + 2 * s, 7 * s, 3.4 * s);
    } else if (jkick || finKick) {
      ctx.fillRect(8 * s, armY - 6 * s, 4.2 * s, 10 * s);
      ctx.fillRect(-12 * s, armY + 2 * s, 7 * s, 3.4 * s);
    } else if (grab && e.kind === 'player') {
      ctx.fillRect(6 * s, armY - 2 * s, 11 * s, 4 * s);
      ctx.fillRect(-10 * s, armY + 1 * s, 8 * s, 3.4 * s);
    } else {
      ctx.fillRect(5 * s, armY + walk * 2 * s, 4 * s, 9 * s);
      ctx.fillRect(-9 * s, armY - walk * 2 * s, 4 * s, 9 * s);
    }

    if (e.kind === 'axe' && e.act === 'punch') {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.fillRect(16 * s, armY - 14 * s, 4 * s, 16 * s);
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.beginPath();
      ctx.moveTo(14 * s, armY - 16 * s);
      ctx.lineTo(26 * s, armY - 10 * s);
      ctx.lineTo(14 * s, armY - 6 * s);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = rgba(look.skin, 1);
    ctx.beginPath();
    ctx.arc(0, bodyY - 8 * s, 6.2 * s, 0, TAU);
    ctx.fill();

    if (look.hairStyle === 'mohawk') {
      ctx.fillStyle = rgba(look.hair, 1);
      ctx.fillRect(-1.6 * s, bodyY - 18 * s, 3.2 * s, 10 * s);
    } else if (look.hairStyle === 'billy') {
      ctx.fillStyle = rgba(look.hair, 1);
      ctx.beginPath();
      ctx.ellipse(-1 * s, bodyY - 10 * s, 6.4 * s, 4.2 * s, -0.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(look.accent, 0.9);
      ctx.fillRect(-6.4 * s, bodyY - 8 * s, 12.8 * s, 1.6 * s);
    } else if (look.hairStyle === 'helm') {
      ctx.fillStyle = rgba(look.hair, 1);
      rr(-6.4 * s, bodyY - 14 * s, 12.8 * s, 8 * s, 3 * s);
      ctx.fill();
      ctx.fillStyle = rgba(look.accent, 0.9);
      ctx.fillRect(-6.4 * s, bodyY - 9 * s, 12.8 * s, 2 * s);
    } else if (look.hairStyle === 'pony') {
      ctx.fillStyle = rgba(look.hair, 1);
      ctx.beginPath();
      ctx.ellipse(0, bodyY - 10 * s, 6.2 * s, 3.6 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(-8 * s, bodyY - 8 * s, 4 * s, 10 * s);
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
      drawFighter(g, lookOf(g.kind || 'player'), {});
      ctx.globalAlpha = a;
    }
  }

  function drawHpChip(e, look) {
    if (!e.boss && e.hp >= e.maxHp) return;
    const w = (e.boss ? 42 : 22) * scale;
    const x = wx(e.x) - w / 2;
    const y = wy(e.y - (e.h || 0) - (e.boss ? 52 : 40) * (look.size || 1));
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
    for (i = sparks.length - 1; i >= 0; i--) {
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
    const name = stageAt(G.stage - 1).name;
    ctx.fillStyle = 'rgba(20,8,4,' + (0.55 * a) + ')';
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
    ctx.fillText(G.kind === 'core' ? '截核' : (G.boss ? G.boss.spec.name : '清场'), ox + 320 * scale, oy + 158 * scale);
  }

  function drawGo() {
    if (G.goT <= 0 || G.mode !== 'play') return;
    const a = G.goT > 0.3 ? 1 : G.goT / 0.3;
    ctx.fillStyle = rgba(GOLD, 0.9 * a);
    ctx.font = '900 ' + (28 * scale) + 'px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('GO →', ox + (VW - 24) * scale, oy + 64 * scale);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0a0402';
    ctx.fillRect(0, 0, W, H);

    const shx = (G.shake ? (Math.random() - 0.5) * G.shake : 0) + G.kickX;
    const shy = (G.shake ? (Math.random() - 0.5) * G.shake * 0.55 : 0) + G.kickY;
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();
    ctx.translate(shx, shy);

    drawSky();
    drawBack();
    drawStreet();

    const list = [];
    let i;
    for (i = 0; i < G.shots.length; i++) list.push({ z: G.shots[i].y, kind: 'shot', o: G.shots[i] });
    for (i = 0; i < G.enemies.length; i++) list.push({ z: G.enemies[i].y, kind: 'foe', o: G.enemies[i] });
    if (G.player) list.push({ z: G.player.y, kind: 'ply', o: G.player });
    list.sort(function (a, b) { return a.z - b.z; });

    drawGhosts();
    for (i = 0; i < list.length; i++) {
      if (list[i].kind === 'shot') drawShot(list[i].o);
      else if (list[i].kind === 'foe') {
        drawFighter(list[i].o, lookOf(list[i].o.kind), { blink: false });
        drawHpChip(list[i].o, lookOf(list[i].o.kind));
      } else {
        drawFighter(list[i].o, lookOf('player'), {
          blink: G.invuln > 0 && G.mode === 'play'
        });
      }
    }

    drawFxWorld();
    drawBossBar();
    drawIntro();
    drawGo();

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
    kickEdge.down = keys.kick && !kickEdge.was;
    if (punchEdge.down && G.player) G.player.punchBuf = 0.12;
    if (kickEdge.down && G.player) G.player.kickBuf = 0.12;
    punchEdge.was = keys.punch;
    kickEdge.was = keys.kick;
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const kickKey = code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyZ'
      || k === 'z' || k === 'Z' || k === 'Shift';
    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (space || k === 'j' || k === 'J') keys.punch = down;
    if (kickKey) keys.kick = down;

    if (down && (isMove || space || k === 'Enter' || kickKey)) e.preventDefault();
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
          keys.punch = false;
          startRun('stage');
          return;
        }
        if (k === '2') { startRun('core'); return; }
      }
      if (G.mode === 'over') {
        if (k === '1' || space || k === 'Enter') {
          keys.punch = false;
          startRun(G.kind);
          return;
        }
        if (k === '2') {
          if (G.won) startRun('core');
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
  bindHold(document.getElementById('btn-kick'), function (v) { keys.kick = v; });

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
  btnStage.addEventListener('click', function () {
    audio.ensure();
    startRun('stage');
  });
  btnCore.addEventListener('click', function () {
    audio.ensure();
    startRun('core');
  });
  modeStage.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'title') { setModes('stage'); G.kind = 'stage'; return; }
    startRun('stage');
  });
  modeCore.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'title') { setModes('core'); G.kind = 'core'; return; }
    startRun('core');
  });
  ovAgain.addEventListener('click', function () {
    audio.ensure();
    startRun(G.kind);
  });
  ovMenu.addEventListener('click', function () {
    audio.ensure();
    audio.ui();
    if (G.won) startRun('core');
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
    if (G.intro > 0 && G.mode === 'play') G.intro = Math.max(0, G.intro - dt);
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
