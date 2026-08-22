'use strict';

(function () {
  const WW = 1080;
  const WH = 800;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const PI = Math.PI;
  const BEST_KEY = 'playbox-skate-720-best';
  const MUTE_KEY = 'playbox-skate-720-mute';
  const OPS = '← → ↑ ↓ / WASD 滑行 · 空格起跳 · 空中←→转板 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [0, 255, 204];
  const WHT = [232, 255, 248];
  const PNK = [255, 154, 212];
  const CON = [26, 52, 48];
  const ASP = [10, 28, 24];

  const ALIGN = 30 * PI / 180;
  const PERFECT = 12 * PI / 180;
  const GRAV = 500;
  const OLLIE_VZ = 128;
  const SPIN_ACC = 18.5;
  const SPIN_MAX = 14.6;
  const TRICK_PTS = [30, 140, 380, 760, 1440, 2200, 3000];
  const EVENT_PTS = { jump: 1600, pipe: 2000, slalom: 2400, race: 3000 };
  const EVENT_CASH = { jump: 5, pipe: 6, slalom: 7, race: 8 };
  const BOOTH_X = 412;
  const BOOTH_Y = 312;

  const CASH_SPOTS = [
    [540, 400], [460, 350], [620, 350], [540, 490],
    [300, 400], [780, 400], [400, 200], [680, 200],
    [400, 620], [680, 620], [250, 300], [830, 500],
    [250, 520], [830, 280], [540, 240]
  ];

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
  const btnPark = document.getElementById('btn-park');
  const btnExtreme = document.getElementById('btn-extreme');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnUp = document.getElementById('btn-up');
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnDown = document.getElementById('btn-down');
  const btnJump = document.getElementById('btn-jump');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const timeEl = document.getElementById('time');
  const tixEl = document.getElementById('tix');
  const scoreBox = document.getElementById('score-box');
  const timeBox = document.getElementById('time-box');
  const tixBox = document.getElementById('tix-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const comboEl = document.getElementById('combo-label');
  const toastEl = document.getElementById('toast');
  const chainEl = document.getElementById('chain-pop');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const timeBar = document.getElementById('time-bar');
  const timeWrap = document.getElementById('time-wrap');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let hidden = false;
  let lastTs = 0;
  let acc = 0;
  let addTok = 0;
  let toastTok = 0;
  let kickTok = 0;
  let chainTok = 0;
  let jumpEdge = false;
  let hudAcc = 0;

  const keys = { l: false, r: false, u: false, d: false, j: false };
  const pad = { l: false, r: false, u: false, d: false, j: false };
  const pointer = { down: false, x: 0, y: 0, id: null };
  const particles = [];
  const floats = [];
  const ghosts = [];
  const sparks = [];
  const cash = [];
  const ramps = [];
  const rails = [];
  const gates = [];
  const cones = [];
  const cps = [];

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rgba(c, a) {
    if (a == null || a >= 0.995) return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }
  function mix(a, b, t) {
    const k = t < 0 ? 0 : t > 1 ? 1 : t;
    return [
      (a[0] + (b[0] - a[0]) * k) | 0,
      (a[1] + (b[1] - a[1]) * k) | 0,
      (a[2] + (b[2] - a[2]) * k) | 0
    ];
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function wrapAng(a) {
    a = a % TAU;
    if (a < -PI) a += TAU;
    if (a > PI) a -= TAU;
    return a;
  }
  function angDiff(a, b) {
    return wrapAng(a - b);
  }
  function turnToward(a, t, max) {
    const d = angDiff(t, a);
    if (d > max) return a + max;
    if (d < -max) return a - max;
    return t;
  }
  function dist2(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    noise: null,
    rollSrc: null,
    rollFilt: null,
    rollGain: null,
    grindSrc: null,
    grindFilt: null,
    grindGain: null,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.36;
        this.master.connect(this.ctx.destination);
        const n = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
        const d = n.getChannelData(0);
        let i;
        for (i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this.noise = n;
        this.makeLoops();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    makeLoops: function () {
      if (!this.ctx || this.rollSrc) return;
      const roll = this.ctx.createBufferSource();
      roll.buffer = this.noise;
      roll.loop = true;
      const rf = this.ctx.createBiquadFilter();
      rf.type = 'bandpass';
      rf.frequency.value = 110;
      rf.Q.value = 1.1;
      const rg = this.ctx.createGain();
      rg.gain.value = 0;
      roll.connect(rf);
      rf.connect(rg);
      rg.connect(this.master);
      roll.start();
      this.rollSrc = roll;
      this.rollFilt = rf;
      this.rollGain = rg;

      const grind = this.ctx.createBufferSource();
      grind.buffer = this.noise;
      grind.loop = true;
      const gf = this.ctx.createBiquadFilter();
      gf.type = 'bandpass';
      gf.frequency.value = 2400;
      gf.Q.value = 2.4;
      const gg = this.ctx.createGain();
      gg.gain.value = 0;
      grind.connect(gf);
      gf.connect(gg);
      gg.connect(this.master);
      grind.start();
      this.grindSrc = grind;
      this.grindFilt = gf;
      this.grindGain = gg;
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.36;
      if (btnMute) {
        btnMute.textContent = m ? '静' : '声';
        btnMute.classList.toggle('muted', m);
        btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      }
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (e) { /* ignore */ }
    },
    roll: function (spd, on) {
      if (!this.rollGain || !this.rollFilt || !this.ctx) return;
      const t = on ? clamp(spd / 260, 0, 1) : 0;
      const now = this.ctx.currentTime;
      this.rollGain.gain.setTargetAtTime(t * 0.085, now, 0.05);
      this.rollFilt.frequency.setTargetAtTime(80 + t * 220, now, 0.05);
    },
    grindLoop: function (on, spd) {
      if (!this.grindGain || !this.grindFilt || !this.ctx) return;
      const now = this.ctx.currentTime;
      const t = on ? clamp(spd / 260, 0.35, 1) : 0;
      this.grindGain.gain.setTargetAtTime(t * 0.07, now, 0.04);
      this.grindFilt.frequency.setTargetAtTime(1800 + t * 1400, now, 0.04);
    }
  };

  function tone(f, dur, type, vol, f2) {
    audio.ensure();
    if (!audio.ctx || audio.muted) return;
    const t = audio.ctx.currentTime;
    const o = audio.ctx.createOscillator();
    const g = audio.ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(40, f2), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(audio.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function noiseBurst(dur, vol, freq, q) {
    audio.ensure();
    if (!audio.ctx || audio.muted || !audio.noise) return;
    const t = audio.ctx.currentTime;
    const src = audio.ctx.createBufferSource();
    src.buffer = audio.noise;
    const f = audio.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q || 1.2;
    const g = audio.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(audio.master);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  function sfx(kind, extra) {
    extra = extra || 0;
    if (kind === 'ollie') {
      noiseBurst(0.08, 0.16, 220, 0.8);
      tone(180, 0.07, 'sine', 0.1, 90);
    } else if (kind === 'launch') {
      noiseBurst(0.14, 0.2, 160, 0.7);
      tone(240, 0.1, 'triangle', 0.1, 420);
    } else if (kind === 'land') {
      noiseBurst(0.1, 0.22, 110, 0.9);
      tone(140 + extra * 40, 0.08, 'sine', 0.12, 80);
    } else if (kind === 'perfect') {
      tone(523, 0.08, 'square', 0.1);
      tone(784, 0.12, 'triangle', 0.08);
    } else if (kind === 'big') {
      tone(392, 0.1, 'square', 0.12);
      tone(523, 0.12, 'triangle', 0.1);
      tone(784, 0.2, 'square', 0.08);
      tone(1046, 0.28, 'sine', 0.07);
    } else if (kind === 'crash') {
      noiseBurst(0.28, 0.26, 180, 0.6);
      tone(160, 0.24, 'sawtooth', 0.12, 48);
    } else if (kind === 'cash') {
      tone(880, 0.07, 'square', 0.1);
      tone(1320, 0.1, 'triangle', 0.08);
    } else if (kind === 'ticket') {
      tone(440, 0.08, 'square', 0.1);
      tone(660, 0.12, 'triangle', 0.08);
    } else if (kind === 'whoosh') {
      noiseBurst(0.12, 0.15, 640 + extra * 80, 0.5);
    } else if (kind === 'grind') {
      noiseBurst(0.06, 0.12, 1800, 2.2);
      tone(320, 0.05, 'square', 0.05);
    } else if (kind === 'event') {
      tone(523, 0.08, 'square', 0.1);
      tone(659, 0.12, 'triangle', 0.08);
    } else if (kind === 'goal') {
      tone(392, 0.1, 'square', 0.12);
      tone(523, 0.12, 'square', 0.1);
      tone(659, 0.16, 'triangle', 0.1);
      tone(784, 0.24, 'sine', 0.08);
    } else if (kind === 'win') {
      tone(523, 0.12, 'square', 0.14);
      tone(659, 0.14, 'square', 0.12);
      tone(784, 0.18, 'triangle', 0.12);
      tone(1046, 0.4, 'sine', 0.1);
    } else if (kind === 'lose') {
      tone(220, 0.18, 'sawtooth', 0.14, 90);
      tone(140, 0.4, 'triangle', 0.12, 60);
    } else if (kind === 'warn') {
      tone(880, 0.06, 'square', 0.08);
      tone(660, 0.08, 'square', 0.05);
    } else if (kind === 'ui') {
      tone(440, 0.05, 'square', 0.08);
    } else if (kind === 'cone') {
      tone(720 + extra * 50, 0.07, 'triangle', 0.09);
      tone(1080, 0.1, 'sine', 0.05);
    }
  }

  const G = {
    mode: 'title',
    kind: 'park',
    t: 0,
    clock: 0,
    x: 540,
    y: 430,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    ang: -PI / 2,
    spin: 0,
    spinVel: 0,
    grind: false,
    grindRail: -1,
    grindU: 0,
    grindDir: 1,
    grindTick: 0,
    bail: 0,
    inv: 0,
    score: 0,
    best: { p: 0, x: 0 },
    time: 56,
    timeMax: 56,
    tickets: 0,
    combo: 1,
    maxCombo: 1,
    camX: 540,
    camY: 430,
    zoom: 1,
    shake: 0,
    flashA: 0,
    flashRgb: GOLD,
    stop: 0,
    punch: 1,
    squash: 1,
    launchCd: 0,
    boothIn: false,
    whooshT: 0,
    event: null,
    eventT: 0,
    eventNeed: 0,
    eventGot: 0,
    done: {},
    doneN: 0,
    needN: 3,
    why: '',
    ending: false,
    endT: 0,
    inX: 0,
    inY: 0,
    spd: 0,
    demoI: 0,
    warnT: 0,
    airFrom: '',
    demoSpin: false,
    gateLock: ''
  };

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      const o = JSON.parse(raw);
      if (o && typeof o === 'object') {
        G.best.p = o.p | 0;
        G.best.x = o.x | 0;
      } else {
        const n = parseInt(raw, 10);
        if (n > 0) G.best.p = n;
      }
    } catch (e) { /* ignore */ }
  }

  function saveBest() {
    try { localStorage.setItem(BEST_KEY, JSON.stringify(G.best)); } catch (e) { /* ignore */ }
  }

  function isExt() {
    return G.kind === 'extreme';
  }

  function kindBest() {
    return isExt() ? G.best.x : G.best.p;
  }

  function startTime() {
    return isExt() ? 38 : 56;
  }

  function drainRate() {
    return isExt() ? 1.32 : 1;
  }

  function cashGain() {
    return isExt() ? 2.8 : 4.4;
  }

  function bailCost() {
    return isExt() ? 6.4 : 4.2;
  }

  function ticketCost() {
    return isExt() ? 8 : 6;
  }

  function maxSpd() {
    return isExt() ? 305 : 268;
  }

  function requiredEvents() {
    return isExt() ? ['jump', 'pipe', 'slalom', 'race'] : ['jump', 'pipe', 'slalom'];
  }

  loadBest();
  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function addRamp(x, y, len, wid, ang, power, type) {
    ramps.push({ x: x, y: y, len: len, wid: wid, ang: ang, power: power, type: type });
  }

  function addRail(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    rails.push({ x1: x1, y1: y1, x2: x2, y2: y2, dx: dx / len, dy: dy / len, len: len });
  }

  function addGate(id, name, x, y) {
    gates.push({ id: id, name: name, x: x, y: y, r: 38 });
  }

  function buildPark() {
    ramps.length = 0;
    rails.length = 0;
    gates.length = 0;
    addRamp(540, 128, 108, 48, -PI / 2, 348, 'kicker');
    addRamp(540, 672, 108, 48, PI / 2, 348, 'kicker');
    addRamp(148, 400, 108, 48, PI, 328, 'kicker');
    addRamp(932, 400, 108, 48, 0, 328, 'kicker');
    addRamp(430, 560, 78, 44, 0, 312, 'pipe');
    addRamp(650, 560, 78, 44, PI, 312, 'pipe');
    addRamp(540, 400, 70, 42, 0, 188, 'box');
    addRail(270, 228, 420, 292);
    addRail(660, 228, 810, 292);
    addRail(310, 628, 490, 628);
    addGate('jump', '跳跃', 188, 118);
    addGate('pipe', '坡道', 892, 662);
    addGate('slalom', '障碍', 188, 662);
    addGate('race', '竞速', 892, 118);
  }

  function resetCash() {
    cash.length = 0;
    const used = {};
    let n = 0;
    let i = 0;
    while (n < 8 && i < 40) {
      const k = (Math.random() * CASH_SPOTS.length) | 0;
      if (!used[k]) {
        used[k] = 1;
        const p = CASH_SPOTS[k];
        cash.push({ x: p[0], y: p[1], alive: true, t: 0, spot: k });
        n += 1;
      }
      i += 1;
    }
  }

  function hitStop(sec) {
    if (REDUCE || G.mode !== 'play') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(cls, ms) {
    if (REDUCE || !stageEl) return;
    stageEl.classList.remove('die', 'hit', 'pop');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
    kickTok += 1;
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) stageEl.classList.remove('die', 'hit', 'pop');
    }, ms || 220);
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    toastTok += 1;
    const tok = toastTok;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 980);
  }

  function chainPop(txt) {
    if (!chainEl) return;
    chainEl.textContent = txt;
    chainEl.classList.remove('hidden');
    void chainEl.offsetWidth;
    chainTok += 1;
    const tok = chainTok;
    setTimeout(function () {
      if (tok === chainTok) chainEl.classList.add('hidden');
    }, 680);
  }

  function flash(rgb, a) {
    G.flashRgb = rgb;
    G.flashA = a;
  }

  function burst(x, y, n, rgb, spd, z) {
    let i;
    for (i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const s = rand(spd * 0.25, spd);
      particles.push({
        x: x,
        y: y,
        z: z || 0,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        vz: rand(20, 90),
        life: rand(0.28, 0.7),
        max: 0.7,
        rgb: rgb,
        size: rand(1.6, 3.6)
      });
    }
    if (particles.length > 240) particles.splice(0, particles.length - 240);
  }

  function floatTxt(x, y, text, rgb) {
    floats.push({ x: x, y: y, z: G.z, text: text, rgb: rgb, t: 0, life: 0.82 });
  }

  function addScore(n) {
    n = n | 0;
    if (n <= 0 || G.mode !== 'play') return;
    G.score += n;
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    if (scoreAdd) {
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + n;
      addTok += 1;
      const tok = addTok;
      setTimeout(function () {
        if (tok === addTok) scoreAdd.hidden = true;
      }, 680);
    }
    const key = isExt() ? 'x' : 'p';
    if (G.score > G.best[key]) {
      G.best[key] = G.score | 0;
      saveBest();
    }
  }

  function addTime(n) {
    if (G.mode !== 'play') return;
    G.time = Math.min(G.timeMax + 18, G.time + n);
    if (n > 0) G.timeMax = Math.max(G.timeMax, G.time);
  }

  function setHint(t, cls) {
    if (!hintEl) return;
    hintEl.textContent = t;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }

  function fmtTime(t) {
    const s = Math.max(0, t);
    const w = Math.floor(s);
    const d = Math.floor((s - w) * 10);
    return w + '.' + d;
  }

  function eventLabel() {
    const need = requiredEvents();
    const names = { jump: '跳', pipe: '坡', slalom: '障', race: '竞' };
    let s = '';
    let i;
    for (i = 0; i < need.length; i++) {
      if (i) s += ' ';
      s += names[need[i]] + (G.done[need[i]] ? '✓' : '');
    }
    if (G.event) {
      const g = gateById(G.event);
      s = (g ? g.name : G.event) + ' ' + G.eventGot + '/' + G.eventNeed;
    }
    return s;
  }

  function hud() {
    if (scoreEl) scoreEl.textContent = String(G.score | 0);
    if (bestEl) bestEl.textContent = String(kindBest() | 0);
    if (timeEl) timeEl.textContent = fmtTime(G.time);
    if (tixEl) tixEl.textContent = String(G.tickets | 0);
    if (stageLabel) {
      stageLabel.textContent = isExt() ? '极限' : '公园';
      stageLabel.classList.toggle('hot', isExt());
    }
    if (tagLabel) {
      tagLabel.textContent = G.mode === 'title' ? 'SK8' : eventLabel();
      tagLabel.classList.toggle('warn', isExt());
    }
    const ratio = G.timeMax > 0 ? clamp(G.time / G.timeMax, 0, 1) : 0;
    if (timeBar) timeBar.style.transform = 'scaleX(' + ratio + ')';
    const low = G.mode === 'play' && G.time <= 8;
    if (timeBox) timeBox.classList.toggle('low', low);
    if (timeWrap) timeWrap.classList.toggle('low', low);
    if (comboEl) {
      comboEl.hidden = G.combo < 2 || G.mode !== 'play';
      comboEl.textContent = '连滑 ×' + G.combo;
    }
    if (tixBox) tixBox.classList.toggle('flash', false);
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'win' ? '720°' : kind === 'lose' ? 'CASH OUT' : 'SK8';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function gateById(id) {
    let i;
    for (i = 0; i < gates.length; i++) if (gates[i].id === id) return gates[i];
    return null;
  }

  function resetSkater(x, y) {
    G.x = x;
    G.y = y;
    G.z = 0;
    G.vx = 0;
    G.vy = 0;
    G.vz = 0;
    G.ang = -PI / 2;
    G.spin = 0;
    G.spinVel = 0;
    G.grind = false;
    G.grindRail = -1;
    G.bail = 0;
    G.inv = 0.4;
    G.squash = 1.15;
    G.launchCd = 0;
    G.airFrom = '';
  }

  function clearEventBits() {
    cones.length = 0;
    cps.length = 0;
    G.event = null;
    G.eventT = 0;
    G.eventNeed = 0;
    G.eventGot = 0;
  }

  function showTitle() {
    G.mode = 'title';
    G.kind = 'park';
    G.score = 0;
    G.combo = 1;
    G.tickets = 0;
    G.done = {};
    G.doneN = 0;
    G.ending = false;
    G.time = startTime();
    G.timeMax = G.time;
    clearEventBits();
    resetSkater(540, 460);
    G.vx = 70;
    G.ang = 0;
    G.demoI = 0;
    G.camX = G.x;
    G.camY = G.y;
    resetCash();
    particles.length = 0;
    floats.length = 0;
    ghosts.length = 0;
    sparks.length = 0;
    showOverlay('title', '滑板', '俯视滑板公园。冲坡起飞，空中转板，对齐落地拿分。捡现金续时，买票参赛。');
    setHint('方向键滑行 · 空格起跳 · 空中←→转板 · 捡现金 · R 重开', '');
    hud();
  }

  function start(kind) {
    audio.ensure();
    sfx('ui');
    G.kind = kind === 'extreme' ? 'extreme' : 'park';
    G.mode = 'play';
    G.score = 0;
    G.combo = 1;
    G.maxCombo = 1;
    G.tickets = 0;
    G.done = {};
    G.doneN = 0;
    G.needN = requiredEvents().length;
    G.ending = false;
    G.endT = 0;
    G.why = '';
    G.time = startTime();
    G.timeMax = G.time;
    G.clock = 0;
    G.warnT = 0;
    G.demoSpin = false;
    G.gateLock = '';
    keys.l = keys.r = keys.u = keys.d = keys.j = false;
    jumpEdge = false;
    clearEventBits();
    resetSkater(540, 460);
    G.camX = G.x;
    G.camY = G.y;
    resetCash();
    particles.length = 0;
    floats.length = 0;
    ghosts.length = 0;
    sparks.length = 0;
    hideOverlay();
    toast(isExt() ? '极限 · 现金更快' : '公园 · 自由滑', false, !isExt());
    setHint('冲坡起飞 · 空中转板对齐落地 · 售票处买票参赛', isExt() ? 'warn' : 'hot');
    hud();
  }

  function retry() {
    audio.ensure();
    if (G.mode === 'title') start('park');
    else start(G.kind);
  }

  function winGame() {
    if (G.mode !== 'play' || G.ending) return;
    G.ending = true;
    G.endT = 0.55;
    G.why = 'win';
    const bonus = (G.time * 50) | 0;
    addScore(bonus);
    sfx('win');
    flash(GOLD, 0.7);
    kick('pop', 280);
    hitStop(0.07);
    chainPop('720°');
  }

  function loseGame() {
    if (G.mode !== 'play' || G.ending) return;
    G.ending = true;
    G.endT = 0.7;
    G.why = 'lose';
    sfx('lose');
    flash(MAG, 0.55);
    kick('die', 340);
  }

  function finishEnd() {
    G.mode = G.why === 'win' ? 'win' : 'lose';
    audio.roll(0, false);
    audio.grindLoop(false, 0);
    if (G.why === 'win') {
      showOverlay('win', '完赛', '赛事拿下。分数 ' + G.score + ' · 剩余现金 ' + fmtTime(G.time) + ' · 连滑最高 ×' + G.maxCombo);
      setHint('R 再滑 · 换模式回标题', 'hot');
    } else {
      showOverlay('lose', '现金耗尽', '时间就是钱。分数 ' + G.score + ' · 完成 ' + G.doneN + '/' + G.needN + ' 项赛事');
      setHint('R 重开 · 捡现金能续更久', 'warn');
    }
    hud();
  }

  function inRamp(px, py, r) {
    const dx = px - r.x;
    const dy = py - r.y;
    const c = Math.cos(-r.ang);
    const s = Math.sin(-r.ang);
    const lx = dx * c - dy * s;
    const ly = dx * s + dy * c;
    return Math.abs(lx) < r.len * 0.5 && Math.abs(ly) < r.wid * 0.5;
  }

  function closestRail(px, py) {
    let best = -1;
    let bestD = 18;
    let bestU = 0;
    let i;
    for (i = 0; i < rails.length; i++) {
      const r = rails[i];
      const ux = px - r.x1;
      const uy = py - r.y1;
      let u = (ux * r.dx + uy * r.dy) / r.len;
      if (u < 0) u = 0;
      if (u > 1) u = 1;
      const sx = r.x1 + r.dx * u * r.len;
      const sy = r.y1 + r.dy * u * r.len;
      const d = Math.hypot(px - sx, py - sy);
      if (d < bestD) {
        bestD = d;
        best = i;
        bestU = u;
      }
    }
    return best < 0 ? null : { i: best, u: bestU, d: bestD };
  }

  function wishDir() {
    let ix = 0;
    let iy = 0;
    if (keys.l || pad.l) ix -= 1;
    if (keys.r || pad.r) ix += 1;
    if (keys.u || pad.u) iy -= 1;
    if (keys.d || pad.d) iy += 1;
    if (pointer.down && G.mode === 'play' && G.z <= 0 && !G.grind) {
      const p = worldToScreen(G.x, G.y);
      const dx = pointer.x - p.x;
      const dy = pointer.y - p.y;
      if (Math.hypot(dx, dy) > 12) {
        ix = dx;
        iy = dy;
      }
    }
    const m = Math.hypot(ix, iy);
    if (m < 0.2) {
      G.inX = 0;
      G.inY = 0;
      return false;
    }
    G.inX = ix / m;
    G.inY = iy / m;
    return true;
  }

  function demoSteer(dt) {
    const pts = [
      [540, 430], [540, 220], [540, 140], [700, 220], [860, 400],
      [700, 560], [540, 620], [380, 560], [220, 400], [380, 220]
    ];
    const p = pts[G.demoI % pts.length];
    const dx = p[0] - G.x;
    const dy = p[1] - G.y;
    if (dx * dx + dy * dy < 1600) G.demoI += 1;
    const m = Math.hypot(dx, dy) || 1;
    G.inX = dx / m;
    G.inY = dy / m;
    G.demoSpin = G.z > 6;
    if (G.z <= 0 && G.spd > 90 && Math.random() < dt * 0.35) jumpEdge = true;
  }

  function trickName(half) {
    if (half <= 0) return '起跳';
    if (half === 1) return '180';
    if (half === 2) return '360';
    if (half === 3) return '540';
    if (half === 4) return '720';
    return (half * 180) + '°';
  }

  function landAlign() {
    const board = G.ang + G.spin;
    let travel = G.ang;
    if (G.spd > 28) travel = Math.atan2(G.vy, G.vx);
    const d0 = Math.abs(angDiff(board, travel));
    const d1 = Math.abs(angDiff(board, travel + PI));
    const err = d0 < d1 ? d0 : d1;
    return { err: err, travel: travel, switch: d1 < d0, board: board };
  }

  function doOllie() {
    if (G.bail > 0) return;
    if (G.grind) {
      exitGrind(true);
      return;
    }
    if (G.z > 2) return;
    G.z = 4;
    G.vz = OLLIE_VZ + G.spd * 0.12;
    G.spin = 0;
    G.spinVel = 0;
    G.airFrom = 'ollie';
    G.squash = 0.72;
    sfx('ollie');
    burst(G.x, G.y, 8, WHT, 70, 2);
    kick('hit', 120);
  }

  function launchFrom(r) {
    const c = Math.cos(r.ang);
    const s = Math.sin(r.ang);
    let dirx = c;
    let diry = s;
    if (r.type === 'box') {
      if (G.spd > 20) {
        dirx = G.vx / G.spd;
        diry = G.vy / G.spd;
      }
    }
    const pow = r.power * (0.55 + 0.55 * clamp(G.spd / maxSpd(), 0, 1));
    G.z = Math.max(G.z, 8);
    G.vz = pow;
    G.vx += dirx * (40 + G.spd * 0.08);
    G.vy += diry * (40 + G.spd * 0.08);
    G.spin = 0;
    G.spinVel = 0;
    G.launchCd = 0.42;
    G.airFrom = r.type;
    G.squash = 0.78;
    sfx('launch');
    burst(G.x, G.y, 14, HOT, 90, 4);
    flash(CYN, 0.22);
    kick('pop', 160);
    if (G.event === 'pipe' && r.type === 'pipe') {
      G.eventGot += 1;
      floatTxt(G.x, G.y, '坡 ' + G.eventGot + '/' + G.eventNeed, CYN);
      sfx('cone', G.eventGot);
      if (G.eventGot >= G.eventNeed) completeEvent();
    }
  }

  function tryLaunch() {
    if (G.z > 6 || G.grind || G.bail > 0 || G.launchCd > 0) return;
    let i;
    for (i = 0; i < ramps.length; i++) {
      const r = ramps[i];
      if (!inRamp(G.x, G.y, r)) continue;
      let dirx = Math.cos(r.ang);
      let diry = Math.sin(r.ang);
      if (r.type === 'box') {
        if (G.z > 2 && G.spd > 60) launchFrom(r);
        return;
      }
      const dot = G.vx * dirx + G.vy * diry;
      if (dot > 72 && G.spd > 78) {
        launchFrom(r);
        return;
      }
    }
  }

  function tryGrind() {
    if (G.grind || G.bail > 0) return;
    if (G.z < 4 || G.z > 40) return;
    if (G.spd < 68) return;
    const hit = closestRail(G.x, G.y);
    if (!hit || hit.d > 16) return;
    const r = rails[hit.i];
    const vdot = (G.vx * r.dx + G.vy * r.dy) / (G.spd || 1);
    if (Math.abs(vdot) < 0.62) return;
    G.grind = true;
    G.grindRail = hit.i;
    G.grindU = hit.u;
    G.grindDir = vdot >= 0 ? 1 : -1;
    G.grindTick = 0;
    G.z = 10;
    G.vz = 0;
    G.spin = 0;
    G.spinVel = 0;
    G.ang = Math.atan2(r.dy * G.grindDir, r.dx * G.grindDir);
    sfx('grind');
    hitStop(0.028);
    kick('hit', 100);
    burst(G.x, G.y, 10, GOLD, 80, 8);
  }

  function exitGrind(ollieOff) {
    if (!G.grind) return;
    G.grind = false;
    const r = rails[G.grindRail];
    if (r) {
      G.vx = r.dx * G.grindDir * Math.max(G.spd, 120);
      G.vy = r.dy * G.grindDir * Math.max(G.spd, 120);
    }
    G.grindRail = -1;
    if (ollieOff) {
      G.z = 8;
      G.vz = OLLIE_VZ * 0.85;
      G.airFrom = 'grind';
      sfx('ollie');
    } else {
      G.z = 0;
      G.vz = 0;
    }
  }

  function startEvent(g) {
    G.event = g.id;
    G.tickets -= 1;
    if (G.tickets < 0) G.tickets = 0;
    G.eventGot = 0;
    cones.length = 0;
    cps.length = 0;
    sfx('event');
    flash(GOLD, 0.28);
    toast(g.name + ' 开赛', false, true);
    if (g.id === 'jump') {
      G.eventNeed = 1;
      G.eventT = 16;
      setHint('冲坡起飞，落地至少 360', 'hot');
    } else if (g.id === 'pipe') {
      G.eventNeed = 2;
      G.eventT = 20;
      setHint('U 台连续起飞两次', 'hot');
    } else if (g.id === 'slalom') {
      G.eventNeed = 5;
      G.eventT = 18;
      cones.push(
        { x: 240, y: 620, got: false },
        { x: 330, y: 540, got: false },
        { x: 420, y: 500, got: false },
        { x: 510, y: 455, got: false },
        { x: 600, y: 410, got: false }
      );
      setHint('按序穿过发光桩', 'hot');
    } else {
      G.eventNeed = 4;
      G.eventT = 22;
      cps.push(
        { x: 540, y: 190, got: false },
        { x: 850, y: 400, got: false },
        { x: 540, y: 610, got: false },
        { x: 230, y: 400, got: false }
      );
      setHint('按序点亮四个检查点', 'hot');
    }
    hud();
  }

  function failEvent() {
    const id = G.event;
    const g = gateById(id);
    toast((g ? g.name : '赛事') + ' 未完成', true, false);
    if (!isExt()) G.tickets += 1;
    clearEventBits();
    setHint('冲坡起飞 · 空中转板对齐落地 · 售票处买票参赛', isExt() ? 'warn' : '');
    hud();
  }

  function completeEvent() {
    const id = G.event;
    if (!id) return;
    const g = gateById(id);
    const pts = (EVENT_PTS[id] || 1600) * Math.max(1, G.combo);
    addScore(pts | 0);
    addTime(EVENT_CASH[id] || 5);
    if (!G.done[id]) {
      G.done[id] = true;
      G.doneN += 1;
    }
    floatTxt(G.x, G.y, (g ? g.name : id) + ' +' + pts, GOLD);
    chainPop(g ? g.name : '完');
    sfx('goal');
    flash(GOLD, 0.5);
    hitStop(0.055);
    kick('pop', 240);
    burst(G.x, G.y, 28, GOLD, 140, 10);
    clearEventBits();
    setHint('赛事 ' + G.doneN + '/' + G.needN + ' · 继续滑', 'hot');
    hud();
    if (G.doneN >= G.needN) winGame();
  }

  function doLand() {
    const align = landAlign();
    const spun = Math.abs(G.spin);
    const half = Math.round(spun / PI);
    const deg = spun * 180 / PI;
    G.z = 0;
    G.vz = 0;
    G.squash = 0.62;
    const tiny = deg < 42;
    const crash = !tiny && align.err > ALIGN;
    if (crash) {
      if (G.mode !== 'play') {
        G.spin = 0;
        G.spinVel = 0;
        G.z = 0;
        G.vz = 0;
        return;
      }
      doBail('转板没对齐');
      return;
    }
    G.ang = align.switch ? align.travel + PI : align.travel;
    G.spin = 0;
    G.spinVel = 0;
    const h = half > 6 ? 6 : half;
    const base = TRICK_PTS[h] || 30;
    const perfect = align.err < PERFECT && half >= 1;
    const mul = G.combo * (perfect ? 1.25 : 1);
    const pts = (base * mul) | 0;
    addScore(pts);
    floatTxt(G.x, G.y, (perfect ? '正 ' : '') + trickName(half) + ' +' + pts, half >= 4 ? GOLD : HOT);
    G.combo = Math.min(8, G.combo + (half >= 1 ? 1 : 0));
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    if (comboEl && G.combo >= 2) {
      comboEl.hidden = false;
      comboEl.textContent = '连滑 ×' + G.combo;
      comboEl.classList.remove('hot');
      void comboEl.offsetWidth;
      comboEl.classList.add('hot');
    }
    const hs = half >= 4 ? 0.08 : half >= 2 ? 0.05 : half >= 1 ? 0.036 : 0.03;
    hitStop(hs);
    kick(half >= 4 ? 'pop' : 'hit', half >= 4 ? 240 : 140);
    G.shake = Math.max(G.shake, 4 + half * 1.6);
    burst(G.x, G.y, 10 + half * 4, half >= 4 ? GOLD : HOT, 70 + half * 18, 2);
    if (half >= 4) {
      sfx('big');
      chainPop(trickName(half));
      flash(GOLD, 0.55);
      addTime(half >= 4 ? 3.2 : 0);
    } else if (perfect) {
      sfx('perfect');
      flash(CYN, 0.28);
    } else {
      sfx('land', half);
    }
    if (G.event === 'jump' && half >= 2) {
      G.eventGot = 1;
      completeEvent();
    }
  }

  function doBail(why) {
    G.bail = 1.18;
    G.z = 6;
    G.vz = 80;
    G.spinVel = (Math.random() > 0.5 ? 1 : -1) * 8;
    G.grind = false;
    G.combo = 1;
    G.inv = 0.7;
    addTime(-bailCost());
    floatTxt(G.x, G.y, '-' + bailCost().toFixed(1), MAG);
    if (G.mode === 'play') toast('摔倒 · ' + why, true, false);
    sfx('crash');
    hitStop(0.07);
    kick('die', 320);
    G.shake = 10;
    flash(MAG, 0.45);
    burst(G.x, G.y, 22, MAG, 120, 8);
    if (G.mode === 'play' && G.time <= 0) loseGame();
  }

  function collectCash() {
    let i;
    for (i = 0; i < cash.length; i++) {
      const c = cash[i];
      if (!c.alive) continue;
      if (dist2(G.x, G.y, c.x, c.y) < 26 * 26 && G.z < 28) {
        c.alive = false;
        c.t = isExt() ? 4.2 : 5.2;
        addTime(cashGain());
        addScore(60 * G.combo);
        sfx('cash');
        burst(c.x, c.y, 12, GOLD, 90, 4);
        floatTxt(c.x, c.y, '+' + cashGain().toFixed(1), GOLD);
        flash(GOLD, 0.18);
      }
    }
  }

  function tickCash(dt) {
    let i;
    for (i = 0; i < cash.length; i++) {
      const c = cash[i];
      if (c.alive) continue;
      c.t -= dt;
      if (c.t <= 0) {
        let k = (Math.random() * CASH_SPOTS.length) | 0;
        let n = 0;
        while (n < 8) {
          const p = CASH_SPOTS[k];
          let ok = true;
          let j;
          for (j = 0; j < cash.length; j++) {
            if (cash[j].alive && dist2(cash[j].x, cash[j].y, p[0], p[1]) < 40 * 40) ok = false;
          }
          if (ok && dist2(G.x, G.y, p[0], p[1]) > 50 * 50) break;
          k = (k + 1) % CASH_SPOTS.length;
          n += 1;
        }
        const p = CASH_SPOTS[k];
        c.x = p[0];
        c.y = p[1];
        c.alive = true;
      }
    }
  }

  function tickBooth() {
    const d = dist2(G.x, G.y, BOOTH_X, BOOTH_Y);
    const inside = d < 36 * 36 && G.z < 8 && !G.grind && G.bail <= 0;
    if (inside && !G.boothIn && G.mode === 'play') {
      const cost = ticketCost();
      if (G.time > cost + 6) {
        G.time -= cost;
        G.tickets += 1;
        sfx('ticket');
        toast('票 +1 · -' + cost.toFixed(0), false, true);
        floatTxt(BOOTH_X, BOOTH_Y, '票 +1', PNK);
        burst(BOOTH_X, BOOTH_Y, 14, PNK, 80, 6);
        if (tixBox) {
          tixBox.classList.remove('flash');
          void tixBox.offsetWidth;
          tixBox.classList.add('flash');
        }
        hud();
      } else {
        toast('现金不够买票', true, false);
      }
    }
    G.boothIn = inside;
  }

  function tickGates() {
    if (G.event || G.bail > 0 || G.z > 10) {
      G.gateLock = '';
      return;
    }
    let i;
    let hit = '';
    for (i = 0; i < gates.length; i++) {
      const g = gates[i];
      if (g.id === 'race' && !isExt()) continue;
      if (dist2(G.x, G.y, g.x, g.y) < g.r * g.r) {
        hit = g.id;
        if (G.gateLock === g.id) return;
        G.gateLock = g.id;
        if (G.done[g.id]) {
          toast(g.name + ' 已完成', false, true);
          return;
        }
        if (G.tickets <= 0) {
          toast('先去售票处买票', true, false);
          return;
        }
        startEvent(g);
        return;
      }
    }
    if (!hit) G.gateLock = '';
  }

  function tickEventObjectives() {
    if (!G.event) return;
    if (G.event === 'slalom') {
      const c = cones[G.eventGot];
      if (c && dist2(G.x, G.y, c.x, c.y) < 28 * 28) {
        c.got = true;
        G.eventGot += 1;
        sfx('cone', G.eventGot);
        addScore(80 * G.combo);
        burst(c.x, c.y, 10, CYN, 80, 4);
        if (G.eventGot >= G.eventNeed) completeEvent();
      }
    } else if (G.event === 'race') {
      const c = cps[G.eventGot];
      if (c && dist2(G.x, G.y, c.x, c.y) < 34 * 34) {
        c.got = true;
        G.eventGot += 1;
        sfx('cone', G.eventGot);
        addScore(120 * G.combo);
        burst(c.x, c.y, 12, GOLD, 90, 4);
        if (G.eventGot >= G.eventNeed) completeEvent();
      }
    }
  }

  function walls() {
    const m = 56;
    if (G.x < m) { G.x = m; G.vx = Math.abs(G.vx) * 0.35; }
    if (G.x > WW - m) { G.x = WW - m; G.vx = -Math.abs(G.vx) * 0.35; }
    if (G.y < m) { G.y = m; G.vy = Math.abs(G.vy) * 0.35; }
    if (G.y > WH - m) { G.y = WH - m; G.vy = -Math.abs(G.vy) * 0.35; }
  }

  function stepPlayer(dt) {
    if (G.launchCd > 0) G.launchCd -= dt;
    if (G.whooshT > 0) G.whooshT -= dt;
    if (G.inv > 0) G.inv -= dt;

    if (G.bail > 0) {
      G.bail -= dt;
      G.vx *= Math.pow(0.22, dt);
      G.vy *= Math.pow(0.22, dt);
      G.x += G.vx * dt;
      G.y += G.vy * dt;
      G.spin += G.spinVel * dt;
      G.z = Math.max(0, G.z + G.vz * dt);
      G.vz -= GRAV * dt;
      if (G.z <= 0) { G.z = 0; G.vz = 0; }
      walls();
      if (G.bail <= 0) {
        G.spin = 0;
        G.spinVel = 0;
        G.z = 0;
        G.ang = Math.atan2(G.vy, G.vx) || G.ang;
      }
      return;
    }

    if (G.grind) {
      const r = rails[G.grindRail];
      if (!r) { exitGrind(false); return; }
      const spd = Math.max(110, G.spd * 0.98 + 20 * dt);
      G.spd = spd;
      G.grindU += G.grindDir * (spd * dt) / r.len;
      if (G.grindU < 0 || G.grindU > 1) {
        exitGrind(false);
        return;
      }
      G.x = r.x1 + r.dx * G.grindU * r.len;
      G.y = r.y1 + r.dy * G.grindU * r.len;
      G.vx = r.dx * G.grindDir * spd;
      G.vy = r.dy * G.grindDir * spd;
      G.z = 10;
      G.ang = Math.atan2(r.dy * G.grindDir, r.dx * G.grindDir);
      G.grindTick += dt;
      if (G.grindTick >= 0.1) {
        G.grindTick -= 0.1;
        addScore((14 * G.combo) | 0);
      }
      sparks.push({
        x: G.x + rand(-4, 4),
        y: G.y + rand(-4, 4),
        vx: rand(-40, 40),
        vy: rand(-40, 40),
        life: rand(0.12, 0.28),
        rgb: Math.random() > 0.4 ? GOLD : HOT
      });
      if (sparks.length > 80) sparks.splice(0, sparks.length - 80);
      if (jumpEdge) doOllie();
      return;
    }

    if (G.z > 0) {
      G.vz -= GRAV * dt;
      G.z += G.vz * dt;
      let spinIn = (keys.l || pad.l ? -1 : 0) + (keys.r || pad.r ? 1 : 0);
      if (G.mode === 'title' && G.demoSpin) spinIn = 1;
      if (pointer.down && G.mode === 'play') {
        const p = worldToScreen(G.x, G.y);
        if (pointer.x < p.x - 18) G.spinVel -= SPIN_ACC * dt;
        else if (pointer.x > p.x + 18) G.spinVel += SPIN_ACC * dt;
      }
      if (spinIn) G.spinVel += spinIn * SPIN_ACC * dt;
      else G.spinVel *= Math.pow(0.55, dt);
      G.spinVel = clamp(G.spinVel, -SPIN_MAX, SPIN_MAX);
      G.spin += G.spinVel * dt;
      if (Math.abs(G.spinVel) > 7 && G.whooshT <= 0) {
        sfx('whoosh', Math.abs(G.spinVel));
        G.whooshT = 0.15;
      }
      if (Math.abs(G.spinVel) > 5 && !REDUCE) {
        ghosts.push({
          x: G.x, y: G.y, z: G.z,
          ang: G.ang + G.spin,
          life: 0.18
        });
        if (ghosts.length > 12) ghosts.splice(0, ghosts.length - 12);
      }
      G.x += G.vx * dt;
      G.y += G.vy * dt;
      G.spd = Math.hypot(G.vx, G.vy);
      walls();
      tryGrind();
      if (G.z <= 0) doLand();
      return;
    }

    G.z = 0;
    G.vz = 0;
    const pushing = G.mode === 'title' ? (Math.hypot(G.inX, G.inY) > 0.2) : wishDir();
    const turn = 4.1 + 5.2 * (1 - clamp(G.spd / maxSpd(), 0, 1));
    if (pushing) {
      const target = Math.atan2(G.inY, G.inX);
      G.ang = turnToward(G.ang, target, turn * dt);
      const acc = isExt() ? 430 : 390;
      G.vx += Math.cos(G.ang) * acc * dt;
      G.vy += Math.sin(G.ang) * acc * dt;
    } else {
      const fr = Math.pow(0.18, dt);
      G.vx *= fr;
      G.vy *= fr;
    }
    G.spd = Math.hypot(G.vx, G.vy);
    const cap = maxSpd();
    if (G.spd > cap) {
      G.vx *= cap / G.spd;
      G.vy *= cap / G.spd;
      G.spd = cap;
    }
    G.x += G.vx * dt;
    G.y += G.vy * dt;
    walls();
    if (jumpEdge) doOllie();
    tryLaunch();
    if (G.spd > 40) {
      if (Math.random() < dt * 14) {
        particles.push({
          x: G.x - Math.cos(G.ang) * 10,
          y: G.y - Math.sin(G.ang) * 10,
          z: 0,
          vx: rand(-20, 20),
          vy: rand(-20, 20),
          vz: rand(4, 18),
          life: 0.28,
          max: 0.28,
          rgb: mix(ASP, HOT, 0.25),
          size: rand(1.2, 2.4)
        });
      }
    }
  }

  function step(dt) {
    G.t += dt;
    G.squash = lerp(G.squash, 1, 1 - Math.pow(0.0008, dt));
    G.shake *= Math.pow(0.04, dt);
    G.flashA *= Math.pow(0.04, dt);
    G.punch = lerp(G.punch, 1, 0.2);

    let i;
    for (i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vz -= 140 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      floats[i].t += dt;
      if (floats[i].t >= floats[i].life) floats.splice(i, 1);
    }
    for (i = ghosts.length - 1; i >= 0; i--) {
      ghosts[i].life -= dt;
      if (ghosts[i].life <= 0) ghosts.splice(i, 1);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0) sparks.splice(i, 1);
    }

    if (G.stop > 0) {
      G.stop -= dt;
      jumpEdge = false;
      return;
    }

    if (G.mode === 'title') demoSteer(dt);

    if (G.mode === 'win' || G.mode === 'lose') {
      jumpEdge = false;
      audio.roll(0, false);
      audio.grindLoop(false, 0);
      return;
    }

    stepPlayer(dt);
    jumpEdge = false;

    if (G.mode === 'play' && !G.ending) {
      G.clock += dt;
      G.time -= dt * drainRate();
      if (G.event) {
        G.eventT -= dt;
        if (G.eventT <= 0) failEvent();
      }
      collectCash();
      tickCash(dt);
      tickBooth();
      tickGates();
      tickEventObjectives();
      if (G.time <= 8 && G.time > 0 && G.t > G.warnT) {
        G.warnT = G.t + 1;
        sfx('warn');
      }
      if (G.time <= 0) {
        G.time = 0;
        loseGame();
      }
    } else {
      tickCash(dt);
    }

    if (G.ending) {
      G.endT -= dt;
      if (G.endT <= 0) finishEnd();
    }

    const look = 0.16;
    G.camX = lerp(G.camX, G.x + G.vx * look, 1 - Math.pow(0.04, dt));
    G.camY = lerp(G.camY, G.y + G.vy * look, 1 - Math.pow(0.04, dt));

    const onGround = G.z <= 0 && !G.grind && G.bail <= 0;
    audio.roll(G.spd, onGround && G.spd > 18 && (G.mode === 'play' || G.mode === 'title'));
    audio.grindLoop(G.grind, G.spd);

    hudAcc += dt;
    if (hudAcc > 0.08) {
      hudAcc = 0;
      hud();
    }
  }

  function worldToScreen(x, y) {
    return {
      x: (x - G.camX) * G.zoom + W * 0.5,
      y: (y - G.camY) * G.zoom + H * 0.5
    };
  }

  function drawLamp(x, y) {
    const p = worldToScreen(x, y);
    const s = G.zoom;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 4 * s, 4 * s, 2 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba([18, 36, 32], 0.95);
    ctx.fillRect(p.x - 1.4 * s, p.y - 14 * s, 2.8 * s, 16 * s);
    ctx.beginPath();
    ctx.arc(p.x, p.y - 16 * s, 3.4 * s, 0, TAU);
    ctx.fillStyle = rgba(HOT, 0.55);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y - 16 * s, 6 * s, 0, TAU);
    ctx.fillStyle = rgba(HOT, 0.08);
    ctx.fill();
  }

  function drawRamp(r) {
    const c = Math.cos(r.ang);
    const s = Math.sin(r.ang);
    const hl = r.len * 0.5;
    const hw = r.wid * 0.5;
    const backW = hw * 1.15;
    const lipW = hw * 0.62;
    function pt(along, side) {
      return worldToScreen(r.x + c * along - s * side, r.y + s * along + c * side);
    }
    const a = pt(-hl, backW);
    const b = pt(-hl, -backW);
    const d = pt(hl, -lipW);
    const e = pt(hl, lipW);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(d.x, d.y);
    ctx.lineTo(e.x, e.y);
    ctx.closePath();
    const col = r.type === 'pipe' ? mix(CON, CYN, 0.18) : r.type === 'box' ? mix(CON, MAG, 0.12) : mix(CON, HOT, 0.16);
    ctx.fillStyle = rgba(col, 0.95);
    ctx.fill();
    ctx.strokeStyle = rgba(r.type === 'pipe' ? CYN : HOT, 0.7);
    ctx.lineWidth = 2;
    ctx.stroke();
    const lip1 = pt(hl * 0.72, lipW * 0.9);
    const lip2 = pt(hl * 0.72, -lipW * 0.9);
    ctx.strokeStyle = rgba(GOLD, 0.55);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(lip1.x, lip1.y);
    ctx.lineTo(lip2.x, lip2.y);
    ctx.stroke();
    let k;
    for (k = 0; k < 3; k++) {
      const u = -hl + r.len * (0.22 + k * 0.22);
      const p1 = pt(u, 6);
      const p0 = pt(u + 10, 0);
      const p2 = pt(u, -6);
      ctx.strokeStyle = rgba(WHT, 0.28);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p0.x, p0.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  function drawRail(r) {
    const a = worldToScreen(r.x1, r.y1);
    const b = worldToScreen(r.x2, r.y2);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(a.x + 2, a.y + 3);
    ctx.lineTo(b.x + 2, b.y + 3);
    ctx.stroke();
    ctx.strokeStyle = rgba([196, 210, 214], 0.95);
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.strokeStyle = rgba(GOLD, 0.45);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawBooth() {
    const p = worldToScreen(BOOTH_X, BOOTH_Y);
    const s = G.zoom;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 22 * s, 8 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba([28, 18, 36], 0.95);
    ctx.fillRect(-18 * s, -16 * s, 36 * s, 24 * s);
    ctx.fillStyle = rgba(MAG, 0.9);
    ctx.fillRect(-20 * s, -22 * s, 40 * s, 8 * s);
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.font = '700 ' + Math.max(9, 11 * s) + 'px "Segoe UI","PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('售票', 0, -5 * s);
    ctx.fillStyle = rgba(PNK, 0.8);
    ctx.font = '600 ' + Math.max(8, 9 * s) + 'px "Segoe UI","PingFang SC",sans-serif';
    ctx.fillText('-' + ticketCost(), 0, 8 * s);
    ctx.restore();
  }

  function drawGate(g) {
    if (g.id === 'race' && !isExt() && G.mode === 'play') return;
    const p = worldToScreen(g.x, g.y);
    const s = G.zoom;
    const done = !!G.done[g.id];
    const active = G.event === g.id;
    const col = done ? GOLD : active ? CYN : HOT;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.strokeStyle = rgba(col, 0.35 + (active ? 0.35 : 0));
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 4, 28 * s, 12 * s, 0, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = rgba([12, 28, 24], 0.8);
    ctx.fillRect(-16 * s, -26 * s, 8 * s, 30 * s);
    ctx.fillRect(8 * s, -26 * s, 8 * s, 30 * s);
    ctx.fillStyle = rgba(col, 0.92);
    ctx.fillRect(-16 * s, -32 * s, 32 * s, 8 * s);
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.font = '700 ' + Math.max(8, 10 * s) + 'px "Segoe UI","PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(done ? '✓' : g.name, 0, -28 * s);
    ctx.restore();
  }

  function drawCash(c) {
    if (!c.alive) return;
    const p = worldToScreen(c.x, c.y);
    const bob = Math.sin(G.t * 5 + c.x * 0.02) * 3;
    const s = G.zoom;
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 8 * s, 3 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(0, 0, 7.2 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba([90, 60, 10], 0.95);
    ctx.font = '700 ' + Math.max(8, 10 * s) + 'px "Segoe UI",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, 0.5);
    ctx.restore();
  }

  function drawMarker(x, y, i, got, col) {
    const p = worldToScreen(x, y);
    const s = G.zoom;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.strokeStyle = rgba(col, got ? 0.25 : 0.85);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16 * s, 8 * s, 0, 0, TAU);
    ctx.stroke();
    if (!got) {
      ctx.fillStyle = rgba(col, 0.9);
      ctx.font = '700 ' + Math.max(9, 11 * s) + 'px "Segoe UI",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), 0, -14 * s);
    }
    ctx.restore();
  }

  function drawSkaterBody(ang, z, alpha, crashing) {
    const s = G.zoom;
    const sq = crashing ? 1 : G.squash;
    ctx.save();
    ctx.rotate(ang);
    ctx.globalAlpha = alpha;
    ctx.scale(1, sq);
    ctx.fillStyle = rgba([18, 22, 24], 0.95);
    ctx.beginPath();
    ctx.ellipse(0, 0, 16 * s, 5.4 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, 0, 14.2 * s, 4.2 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.arc(-10 * s, 3.4 * s, 2.1 * s, 0, TAU);
    ctx.arc(10 * s, 3.4 * s, 2.1 * s, 0, TAU);
    ctx.fill();
    if (crashing) {
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.beginPath();
      ctx.arc(8 * s, -18 * s, 4.2 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.95);
      ctx.fillRect(-4 * s, -14 * s, 8 * s, 12 * s);
    } else {
      const lift = z * 0.02;
      ctx.fillStyle = rgba(CYN, 0.95);
      ctx.beginPath();
      ctx.moveTo(-6 * s, -2 * s - lift);
      ctx.lineTo(-4 * s, -11 * s - lift);
      ctx.lineTo(4 * s, -11 * s - lift);
      ctx.lineTo(6 * s, -2 * s - lift);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.96);
      ctx.beginPath();
      ctx.arc(0, -14.5 * s - lift, 3.6 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.fillRect(-2.4 * s, -16.4 * s - lift, 4.8 * s, 1.6 * s);
      const arms = 7 + Math.min(8, Math.abs(G.spinVel) * 0.7);
      ctx.strokeStyle = rgba(WHT, 0.8);
      ctx.lineWidth = 1.6 * s;
      ctx.beginPath();
      ctx.moveTo(-5 * s, -8 * s - lift);
      ctx.lineTo(-arms * s, -4 * s - lift);
      ctx.moveTo(5 * s, -8 * s - lift);
      ctx.lineTo(arms * s, -4 * s - lift);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSkater() {
    const lift = G.z * 0.46;
    const p = worldToScreen(G.x, G.y);
    const s = G.zoom;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,' + (0.28 + clamp(G.z / 180, 0, 0.2)) + ')';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 6, (13 + G.z * 0.04) * s, 5 * s, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    let i;
    for (i = 0; i < ghosts.length; i++) {
      const g = ghosts[i];
      const q = worldToScreen(g.x, g.y);
      ctx.save();
      ctx.translate(q.x, q.y - g.z * 0.46);
      ctx.globalAlpha = clamp(g.life / 0.18, 0, 1) * 0.35;
      drawSkaterBody(g.ang, g.z, 1, false);
      ctx.restore();
    }

    const ang = G.ang + G.spin + (G.bail > 0 ? G.t * 9 : 0);
    ctx.save();
    ctx.translate(p.x, p.y - lift);
    if (G.inv > 0 && ((G.t * 18) | 0) % 2 === 0) ctx.globalAlpha = 0.45;
    drawSkaterBody(ang, G.z, 1, G.bail > 0);
    ctx.restore();

    if (G.z > 10 && G.bail <= 0) {
      const align = landAlign();
      const ok = align.err < ALIGN;
      ctx.save();
      ctx.translate(p.x, p.y - lift);
      ctx.strokeStyle = rgba(ok ? HOT : MAG, 0.55);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 22 * s, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = rgba(GOLD, 0.8);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(G.ang + G.spin) * 22 * s, Math.sin(G.ang + G.spin) * 22 * s);
      ctx.stroke();
      const half = Math.round(Math.abs(G.spin) / PI);
      ctx.fillStyle = rgba(ok ? GOLD : WHT, 0.95);
      ctx.font = '700 ' + Math.max(11, 13 * s) + 'px "Segoe UI",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(trickName(half), 0, -28 * s);
      ctx.restore();
    }
  }

  function drawPark() {
    const origin = worldToScreen(0, 0);
    const corner = worldToScreen(WW, WH);
    ctx.fillStyle = '#071a16';
    ctx.fillRect(origin.x, origin.y, corner.x - origin.x, corner.y - origin.y);

    ctx.strokeStyle = rgba(HOT, 0.06);
    ctx.lineWidth = 1;
    let g;
    for (g = 80; g < WW; g += 80) {
      const a = worldToScreen(g, 48);
      const b = worldToScreen(g, WH - 48);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    for (g = 80; g < WH; g += 80) {
      const a = worldToScreen(48, g);
      const b = worldToScreen(WW - 48, g);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    const c0 = worldToScreen(540, 400);
    ctx.strokeStyle = rgba(HOT, 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(c0.x, c0.y, 92 * G.zoom, 92 * G.zoom, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = rgba(CYN, 0.22);
    ctx.beginPath();
    ctx.ellipse(c0.x, c0.y, 52 * G.zoom, 52 * G.zoom, 0, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = rgba(HOT, 0.12);
    ctx.font = '900 ' + Math.max(18, 28 * G.zoom) + 'px "Segoe UI",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('720', c0.x, c0.y);

    ctx.strokeStyle = rgba(HOT, 0.45);
    ctx.lineWidth = 3;
    const tl = worldToScreen(48, 48);
    const br = worldToScreen(WW - 48, WH - 48);
    ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
    let p;
    for (p = 48; p <= WW - 48; p += 64) {
      drawLamp(p, 48);
      drawLamp(p, WH - 48);
    }
    for (p = 112; p <= WH - 112; p += 64) {
      drawLamp(48, p);
      drawLamp(WW - 48, p);
    }

    let i;
    for (i = 0; i < ramps.length; i++) drawRamp(ramps[i]);
    for (i = 0; i < rails.length; i++) drawRail(rails[i]);
    drawBooth();
    for (i = 0; i < gates.length; i++) drawGate(gates[i]);
    for (i = 0; i < cash.length; i++) drawCash(cash[i]);
    for (i = 0; i < cones.length; i++) drawMarker(cones[i].x, cones[i].y, i, cones[i].got, CYN);
    for (i = 0; i < cps.length; i++) drawMarker(cps[i].x, cps[i].y, i, cps[i].got, GOLD);
  }

  function drawFx() {
    let i;
    for (i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const p = worldToScreen(s.x, s.y);
      ctx.fillStyle = rgba(s.rgb, clamp(s.life / 0.28, 0, 1));
      ctx.fillRect(p.x, p.y, 2.4 * G.zoom, 2.4 * G.zoom);
    }
    for (i = 0; i < particles.length; i++) {
      const p = particles[i];
      const q = worldToScreen(p.x, p.y);
      ctx.fillStyle = rgba(p.rgb, clamp(p.life / p.max, 0, 1));
      ctx.fillRect(q.x, q.y - p.z * 0.4, p.size * G.zoom, p.size * G.zoom);
    }
    ctx.textAlign = 'center';
    ctx.font = '700 ' + Math.max(11, 13 * G.zoom) + 'px "Segoe UI","PingFang SC",sans-serif';
    for (i = 0; i < floats.length; i++) {
      const f = floats[i];
      const p = worldToScreen(f.x, f.y);
      const a = 1 - f.t / f.life;
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.fillText(f.text, p.x, p.y - 18 - f.t * 28 - (f.z || 0) * 0.2);
    }
  }

  function draw() {
    G.zoom = Math.min(W / 640, H / 480) * (1.05 - clamp(G.z / 420, 0, 0.08));
    if (H > W * 1.45) {
      G.zoom = Math.min(W / 560, H / 640) * (1.02 - clamp(G.z / 420, 0, 0.06));
    }
    const vw = W / Math.max(0.2, G.zoom);
    const vh = H / Math.max(0.2, G.zoom);
    if (vw < WW) G.camX = clamp(G.camX, vw * 0.5, WW - vw * 0.5);
    else G.camX = WW * 0.5;
    if (vh < WH) G.camY = clamp(G.camY, vh * 0.5, WH - vh * 0.5);
    else G.camY = WH * 0.5;

    ctx.fillStyle = '#041612';
    ctx.fillRect(0, 0, W, H);

    const sky = ctx.createRadialGradient(W * 0.5, H * 0.18, 20, W * 0.5, H * 0.55, Math.max(W, H) * 0.78);
    sky.addColorStop(0, '#0c2a24');
    sky.addColorStop(1, '#041612');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = rgba(HOT, 0.12);
    let st;
    for (st = 0; st < 28; st++) {
      const sx = (hash2(st * 17 + 3) * W);
      const sy = (hash2(st * 29 + 8) * H);
      ctx.globalAlpha = 0.15 + hash2(st + 4) * 0.35;
      ctx.fillRect(sx, sy, 1.4, 1.4);
    }
    ctx.globalAlpha = 1;

    ctx.save();
    if (!REDUCE && G.mode === 'play') {
      const jx = (hash2((G.t * 40) | 0) - 0.5) * G.shake;
      const jy = (hash2((G.t * 40 + 9) | 0) - 0.5) * G.shake;
      ctx.translate(jx, jy);
    }
    drawPark();
    drawSkater();
    drawFx();
    ctx.restore();

    if (G.flashA > 0.01) {
      ctx.fillStyle = rgba(G.flashRgb, G.flashA * 0.42);
      ctx.fillRect(0, 0, W, H);
    }

    if (G.mode === 'play' && G.spd > 160) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(HOT, 0.06);
      ctx.lineWidth = 1;
      let k;
      for (k = 0; k < 8; k++) {
        const a = G.ang + PI + (k - 4) * 0.04;
        ctx.beginPath();
        ctx.moveTo(W * 0.5, H * 0.5);
        ctx.lineTo(W * 0.5 + Math.cos(a) * 220, H * 0.5 + Math.sin(a) * 220);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function frame(ts) {
    if (!lastTs) lastTs = ts;
    let dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (hidden) {
      requestAnimationFrame(frame);
      return;
    }
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    if (acc > 0.2) acc = 0.2;
    while (acc >= STEP) {
      step(STEP);
      acc -= STEP;
    }
    draw();
    requestAnimationFrame(frame);
  }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function bindPad(el, key) {
    if (!el) return;
    const on = function (e) {
      e.preventDefault();
      pad[key] = true;
      el.classList.add('held');
      audio.ensure();
      if (key === 'j') jumpEdge = true;
    };
    const off = function (e) {
      e.preventDefault();
      pad[key] = false;
      el.classList.remove('held');
    };
    el.addEventListener('pointerdown', on);
    el.addEventListener('pointerup', off);
    el.addEventListener('pointerleave', off);
    el.addEventListener('pointercancel', off);
  }

  bindPad(btnUp, 'u');
  bindPad(btnLeft, 'l');
  bindPad(btnRight, 'r');
  bindPad(btnDown, 'd');
  bindPad(btnJump, 'j');

  function setKey(code, down, e) {
    if (code === 'ArrowUp' || code === 'KeyW') { keys.u = down; if (e) e.preventDefault(); }
    else if (code === 'ArrowDown' || code === 'KeyS') { keys.d = down; if (e) e.preventDefault(); }
    else if (code === 'ArrowLeft' || code === 'KeyA') { keys.l = down; if (e) e.preventDefault(); }
    else if (code === 'ArrowRight' || code === 'KeyD') { keys.r = down; if (e) e.preventDefault(); }
    else if (code === 'Space') {
      if (e) e.preventDefault();
      if (down && !keys.j) jumpEdge = true;
      keys.j = down;
    }
  }

  window.addEventListener('keydown', function (e) {
    if (e.repeat && (e.code === 'KeyR' || e.code === 'KeyM' || e.code === 'Space')) return;
    audio.ensure();
    if (e.code === 'KeyR') {
      e.preventDefault();
      retry();
      return;
    }
    if (e.code === 'KeyM') {
      e.preventDefault();
      audio.setMuted(!audio.muted);
      return;
    }
    if (G.mode === 'title') {
      if (e.code === 'Digit1' || e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') {
        e.preventDefault();
        start('park');
        return;
      }
      if (e.code === 'Digit2') {
        e.preventDefault();
        start('extreme');
        return;
      }
    }
    if ((G.mode === 'win' || G.mode === 'lose') && (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter')) {
      e.preventDefault();
      retry();
      return;
    }
    setKey(e.code, true, e);
  });

  window.addEventListener('keyup', function (e) {
    setKey(e.code, false, e);
  });

  canvas.addEventListener('pointerdown', function (e) {
    audio.ensure();
    if (G.mode !== 'play') return;
    canvas.setPointerCapture(e.pointerId);
    pointer.down = true;
    pointer.id = e.pointerId;
    const r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!pointer.down || e.pointerId !== pointer.id) return;
    const r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
  });
  function ptrUp(e) {
    if (e.pointerId !== pointer.id && pointer.id !== null) return;
    pointer.down = false;
    pointer.id = null;
  }
  canvas.addEventListener('pointerup', ptrUp);
  canvas.addEventListener('pointercancel', ptrUp);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }
  if (btnRetry) {
    btnRetry.addEventListener('click', function () {
      audio.ensure();
      retry();
    });
  }
  if (btnPark) btnPark.addEventListener('click', function () { start('park'); });
  if (btnExtreme) btnExtreme.addEventListener('click', function () { start('extreme'); });
  if (btnOvRetry) btnOvRetry.addEventListener('click', function () { retry(); });
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
      audio.ensure();
      sfx('ui');
      showTitle();
    });
  }

  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      lastTs = 0;
      keys.l = keys.r = keys.u = keys.d = keys.j = false;
      pointer.down = false;
      if (audio.ctx && audio.ctx.state === 'running') audio.ctx.suspend();
      audio.roll(0, false);
      audio.grindLoop(false, 0);
    } else if (audio.ctx && !audio.muted) audio.ctx.resume();
  });

  window.addEventListener('resize', resize);
  buildPark();
  resize();
  showTitle();
  requestAnimationFrame(frame);
})();
