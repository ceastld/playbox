'use strict';

(function () {
  const WORLD = 2200;
  const MARGIN = 48;
  const PLAYER_R = 13;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const EIGHT = 480;
  const MAX_ENEMY = 64;
  const MAX_BULLET = 28;
  const MAX_GEM = 22;
  const MAX_PART = 220;
  const MAX_FLOAT = 48;
  const MAX_RING = 24;
  const MAX_BOLT = 18;
  const MAX_STAIN = 40;
  const VIEW = 800;
  const BEST_KEY = 'playbox-horde-bite-best';
  const MUTE_KEY = 'playbox-horde-bite-mute';
  const AUTO_SPEED_KEY = 'playbox-horde-bite-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_SCALE = [1, 1, 2, 4, 10];
  const AUTO_PICK_WAIT = [0, 0.42, 0.22, 0.08, 0];
  const AUTO_START_WAIT = [0, 0.55, 0.38, 0.2, 0.06];
  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const MAG = [255, 61, 138];
  const PINK = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const WHITE = [255, 255, 255];
  const HOT = [255, 48, 80];

  const TYPES = {
    swarm: { id: 'swarm', name: '潮', r: 11, hp: 9, spd: 78, dmg: 8, xp: 1, rgb: MAG, mass: 1 },
    runner: { id: 'runner', name: '奔潮', r: 9, hp: 8, spd: 128, dmg: 7, xp: 1, rgb: [255, 102, 178], mass: 0.75 },
    brute: { id: 'brute', name: '重潮', r: 18, hp: 52, spd: 50, dmg: 16, xp: 3, rgb: [196, 36, 90], mass: 2.4 },
    elite: { id: 'elite', name: '晶潮', r: 15, hp: 92, spd: 68, dmg: 14, xp: 5, rgb: [198, 86, 255], mass: 1.7 },
    boss: { id: 'boss', name: '潮主', r: 40, hp: 380, spd: 44, dmg: 24, xp: 16, rgb: [255, 44, 88], mass: 7 }
  };

  const UPGRADES = [
    { id: 'bite', name: '噬咬', tag: '主咬', max: 5, line: ['主咬更快更狠', '冷却再削，伤害上升', '可穿透一只', '暴击更凶', '近乎连咬'] },
    { id: 'spread', name: '扇噬', tag: '武装', max: 5, line: ['斜向再咬两道', '扇面更开', '再加两道斜咬', '扇伤上升', '几乎半圈扫潮'] },
    { id: 'orbit', name: '环咬', tag: '武装', max: 5, line: ['齿环绕身刮潮', '再加一齿', '环更快更狠', '再加一齿', '六齿旋噬'] },
    { id: 'lightning', name: '闪噬', tag: '武装', max: 5, line: ['电链跳到近潮', '跳得更远', '再跳一只', '伤害上升', '雷网铺开'] },
    { id: 'speed', name: '疾走', tag: '改装', max: 5, line: ['移速加快，更好闪', '再快一截', '起步更跟手', '疾走到近乎滑', '潮追不上'] },
    { id: 'magnet', name: '磁噬', tag: '改装', max: 5, line: ['光点吸得更远', '磁径再开', '几乎半屏都吸', '吸得更快', '光点自己扑上来'] },
    { id: 'vital', name: '血潮', tag: '改装', max: 5, line: ['上限+并回一口', '再加血皮', '受击硬一点', '回血加快', '厚血硬扛'] }
  ];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const ovBest = document.getElementById('ov-best');
  const ovBtn = document.getElementById('ov-btn');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnAuto = document.getElementById('btn-auto');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');
  const modeEight = document.getElementById('mode-eight');
  const modeEndless = document.getElementById('mode-endless');
  const hpWrap = document.getElementById('hp-wrap');
  const hpFill = document.getElementById('hp-fill');
  const xpFill = document.getElementById('xp-fill');
  const timeLabel = document.getElementById('time-label');
  const killLabel = document.getElementById('kill-label');
  const lvLabel = document.getElementById('lv-label');
  const loadoutEl = document.getElementById('loadout');
  const comboEl = document.getElementById('combo');
  const bannerEl = document.getElementById('banner');
  const toastEl = document.getElementById('toast');
  const vpadEl = document.getElementById('vpad');
  const knobEl = document.getElementById('vpad-knob');
  const pickEl = document.getElementById('pick');
  const picksEl = document.getElementById('picks');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let zoom = 1;
  let camX = 0;
  let camY = 0;
  let hidden = false;
  let last = 0;
  let acc = 0;
  let toastTok = 0;
  let bannerTok = 0;
  let hpTok = 0;
  let seq = 1;

  const keys = { l: false, r: false, u: false, d: false };
  const mouse = { down: false, id: 0, wx: 0, wy: 0 };
  const vpad = { active: false, id: 0, ox: 0, oy: 0, x: 0, y: 0 };
  const pad = { x: 0, y: 0, a: false, aPrev: false, start: false, startPrev: false };
  const autoDir = { x: 1, y: 0 };
  let autoOn = false;
  let autoSpeed = 3;
  let autoOrbit = 1;
  let autoOrbitHold = 0;
  let autoPickT = 0;
  let autoOvWait = 0;

  const P = { x: WORLD * 0.5, y: WORLD * 0.5, vx: 0, vy: 0, face: -0.6, r: PLAYER_R };

  const G = {
    mode: 'title',
    kind: 'eight',
    selKind: 'eight',
    demo: true,
    t: 0,
    clock: 0,
    survived: 0,
    left: EIGHT,
    hp: 100,
    maxHp: 100,
    xp: 0,
    need: 7,
    lv: 1,
    pending: 0,
    kills: 0,
    biteLv: 1,
    spreadLv: 0,
    orbitLv: 0,
    lightningLv: 0,
    speedLv: 0,
    magnetLv: 0,
    vitalLv: 0,
    overflow: 0,
    fireCd: 0,
    zapCd: 0,
    iFrame: 0,
    stop: 0,
    shake: 0,
    kickX: 0,
    kickY: 0,
    punch: 1,
    flash: 0,
    flashRgb: MAG,
    hurt: 0,
    muzzle: 0,
    bossAt: 120,
    bossN: 0,
    bossHp: 0,
    bossMax: 0,
    bossAlive: false,
    nextRing: 42,
    spawnAcc: 0,
    combo: 0,
    thunderAt: -9,
    killQ: [],
    hitsThis: 0,
    gemSfx: 0,
    regenT: 0,
    pulseHp: 0,
    why: '',
    endT: 0,
    cascade: 0,
    pickIds: [],
    warn10: false,
    warnBoss: false,
    bestEight: { t: 0, k: 0 },
    bestEnd: { t: 0, k: 0 },
    newBest: false
  };

  const trail = [];
  const decals = [];
  const motes = [];
  const orbs = [];

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
  function sx(x) {
    return (x - camX) * zoom;
  }
  function sy(y) {
    return (y - camY) * zoom;
  }
  function fmtTime(s) {
    s = Math.max(0, s);
    const m = (s / 60) | 0;
    const r = (s | 0) % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }
  function xpFor(lv) {
    return Math.floor(5 * lv + 1.55 * lv * lv);
  }
  function hpScale() {
    return 1 + G.survived / 260;
  }

  function makePool(n, factory) {
    const free = [];
    const live = [];
    for (let i = 0; i < n; i++) free.push(factory());
    return {
      live: live,
      alloc: function () {
        if (!free.length) return null;
        const o = free.pop();
        o.on = 1;
        live.push(o);
        return o;
      },
      kill: function (i) {
        const o = live[i];
        o.on = 0;
        const lastO = live.pop();
        if (i < live.length) live[i] = lastO;
        free.push(o);
      },
      clear: function () {
        while (live.length) {
          const o = live.pop();
          o.on = 0;
          free.push(o);
        }
      }
    };
  }

  const enemies = makePool(MAX_ENEMY, function () {
    return {
      on: 0, type: 'swarm', x: 0, y: 0, vx: 0, vy: 0, kx: 0, ky: 0,
      r: 11, hp: 9, max: 9, spd: 78, dmg: 8, xp: 1, rgb: MAG, mass: 1,
      seed: 0, flash: 0, sq: 1, dying: 0, bid: 0, orbT: 0, phase: 'move',
      atk: 0, dash: 0, ring: 0, face: 0, w0: 0, wf: 1
    };
  });
  const bullets = makePool(MAX_BULLET, function () {
    return { on: 0, x: 0, y: 0, vx: 0, vy: 0, r: 5, dmg: 10, life: 0.7, id: 0, pierce: 0, kind: 'bite' };
  });
  const gems = makePool(MAX_GEM, function () {
    return { on: 0, x: 0, y: 0, vx: 0, vy: 0, v: 1, life: 16, rgb: CYN, r: 5, pull: 0 };
  });
  const parts = makePool(MAX_PART, function () {
    return { on: 0, x: 0, y: 0, vx: 0, vy: 0, life: 0.4, max: 0.4, r: 2, rgb: MAG, g: 0, k: 0 };
  });
  const floats = makePool(MAX_FLOAT, function () {
    return { on: 0, x: 0, y: 0, vy: -40, life: 0.7, text: '0', crit: 0, rgb: WHITE };
  });
  const rings = makePool(MAX_RING, function () {
    return { on: 0, x: 0, y: 0, r: 8, vr: 140, life: 0.35, max: 0.35, rgb: CYN, w: 3, dmg: 0, from: 0 };
  });
  const bolts = makePool(MAX_BOLT, function () {
    return { on: 0, pts: [], life: 0.12, rgb: CYN };
  });
  const stains = makePool(MAX_STAIN, function () {
    return { on: 0, x: 0, y: 0, r: 10, life: 4, rgb: MAG, a: 0.2 };
  });

  const audio = {
    ctx: null,
    master: null,
    noiseBuf: null,
    muted: false,
    voices: 0,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.28;
        this.master.connect(this.ctx.destination);
        const n = (this.ctx.sampleRate * 0.3) | 0;
        const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.28;
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (e) { /* ignore */ }
    },
    beep: function (freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted || this.voices > 22) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(Math.max(0.0001, vol), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      this.voices += 1;
      const self = this;
      o.onended = function () { self.voices -= 1; };
      o.start(t);
      o.stop(t + dur + 0.03);
    },
    noise: function (dur, vol, freq, type) {
      if (!this.ctx || this.muted || !this.noiseBuf || this.voices > 22) return;
      const t = this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const f = this.ctx.createBiquadFilter();
      f.type = type || 'bandpass';
      f.frequency.value = freq || 900;
      f.Q.value = type === 'lowpass' ? 0.65 : 1.05;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(Math.max(0.0001, vol), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      this.voices += 1;
      const self = this;
      src.onended = function () { self.voices -= 1; };
      src.start(t);
      src.stop(t + dur + 0.02);
    },
    shot: function () {
      this.ensure();
      this.beep(1560, 0.04, 'square', 0.03, 420);
      this.beep(880, 0.05, 'sine', 0.025, 220);
    },
    hit: function (crit, n) {
      this.ensure();
      if (n > 5 && !crit) return;
      const p = crit ? 1.28 : 1 + Math.min(0.4, n * 0.04);
      this.beep(420 * p, 0.045, crit ? 'square' : 'triangle', crit ? 0.07 : 0.04, 180 * p);
      this.beep(980 * p, 0.03, 'sine', crit ? 0.05 : 0.028, 360);
      if (crit) {
        this.noise(0.06, 0.07, 1800, 'highpass');
        this.beep(1480, 0.07, 'triangle', 0.045, 2200);
      }
    },
    kill: function (burst) {
      this.ensure();
      const p = 1 + Math.min(0.9, burst * 0.035);
      this.noise(0.07, 0.06, 700 * p, 'bandpass');
      this.beep(240 * p, 0.08, 'sine', 0.055, 70);
      this.beep(720 * p, 0.05, 'triangle', 0.03, 220);
    },
    thunder: function () {
      this.ensure();
      this.noise(0.42, 0.16, 110, 'lowpass');
      this.noise(0.18, 0.08, 420, 'bandpass');
      this.beep(56, 0.38, 'sine', 0.14, 28);
      this.beep(84, 0.22, 'sawtooth', 0.05, 40);
      this.beep(392, 0.16, 'triangle', 0.05, 784);
      this.beep(588, 0.22, 'sine', 0.04, 1176);
    },
    gem: function () {
      this.ensure();
      this.beep(1480, 0.05, 'sine', 0.028, 2100);
    },
    level: function () {
      this.ensure();
      this.beep(523, 0.1, 'triangle', 0.06);
      this.beep(659, 0.12, 'sine', 0.05);
      this.beep(784, 0.18, 'triangle', 0.055, 1175);
    },
    pick: function () {
      this.ensure();
      this.beep(880, 0.08, 'sine', 0.05, 1320);
      this.noise(0.05, 0.04, 1800, 'highpass');
    },
    hurt: function () {
      this.ensure();
      this.noise(0.12, 0.1, 280, 'lowpass');
      this.beep(180, 0.16, 'sawtooth', 0.07, 70);
      this.beep(90, 0.2, 'sine', 0.06, 40);
    },
    zap: function () {
      this.ensure();
      this.noise(0.09, 0.08, 2400, 'highpass');
      this.beep(1640, 0.07, 'square', 0.04, 280);
      this.beep(220, 0.08, 'sine', 0.04, 80);
    },
    boss: function () {
      this.ensure();
      this.beep(70, 0.4, 'sine', 0.1, 36);
      this.noise(0.28, 0.1, 140, 'lowpass');
      this.beep(110, 0.22, 'sawtooth', 0.05, 48);
    },
    start: function () {
      this.ensure();
      this.beep(196, 0.1, 'sine', 0.05, 392);
      this.beep(392, 0.14, 'triangle', 0.045, 784);
      this.beep(587, 0.18, 'sine', 0.04, 880);
    },
    win: function () {
      this.ensure();
      this.beep(523, 0.14, 'sine', 0.06);
      this.beep(659, 0.16, 'triangle', 0.05);
      this.beep(784, 0.22, 'sine', 0.055, 1175);
      this.beep(1046, 0.32, 'triangle', 0.045, 1568);
    },
    lose: function () {
      this.ensure();
      this.beep(220, 0.28, 'sawtooth', 0.07, 70);
      this.beep(110, 0.45, 'sine', 0.08, 40);
      this.noise(0.3, 0.08, 180, 'lowpass');
    },
    warn: function () {
      this.ensure();
      this.beep(330, 0.12, 'square', 0.04, 180);
      this.beep(220, 0.16, 'sine', 0.04, 110);
    }
  };

  try { audio.muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { audio.muted = false; }

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (raw) {
        const j = JSON.parse(raw);
        if (j && j.eight) G.bestEight = { t: j.eight.t | 0, k: j.eight.k | 0 };
        if (j && j.endless) G.bestEnd = { t: j.endless.t | 0, k: j.endless.k | 0 };
      }
    } catch (e) { /* ignore */ }
  }

  function saveBest() {
    const rec = { t: G.survived | 0, k: G.kills | 0 };
    const key = G.kind === 'eight' ? 'bestEight' : 'bestEnd';
    const cur = G[key];
    const better = rec.t > cur.t || (rec.t === cur.t && rec.k > cur.k);
    if (better && rec.t > 0) {
      G[key] = rec;
      G.newBest = true;
      try {
        localStorage.setItem(BEST_KEY, JSON.stringify({
          eight: G.bestEight,
          endless: G.bestEnd
        }));
      } catch (e) { /* ignore */ }
    }
  }

  function loadAutoSpeed() {
    try {
      const n = parseInt(localStorage.getItem(AUTO_SPEED_KEY) || '3', 10);
      if (!isFinite(n) || n < 1 || n > 4) return 3;
      return n;
    } catch (e) {
      return 3;
    }
  }

  function saveAutoSpeed(n) {
    try { localStorage.setItem(AUTO_SPEED_KEY, String(n)); } catch (e) { /* ignore */ }
  }

  function currentBest() {
    return G.selKind === 'eight' ? G.bestEight : G.bestEnd;
  }

  function bestText() {
    const b = currentBest();
    const tag = G.selKind === 'eight' ? '八分钟' : '无尽';
    if (!b || b.t <= 0) return tag + ' · 尚无最佳';
    return tag + ' 最佳 ' + fmtTime(b.t) + ' · 噬 ' + b.k;
  }

  function stats() {
    const bite = Math.max(1, G.biteLv);
    const ov = 1 + 0.12 * G.overflow;
    return {
      spd: 164 * Math.pow(1.13, G.speedLv),
      mag: 52 + G.magnetLv * 38,
      dmg: (12 + (bite - 1) * 5) * ov,
      cd: 0.33 * Math.pow(0.88, bite - 1),
      crit: 0.16 + 0.03 * bite + 0.04 * G.overflow,
      pierce: bite >= 3 ? 1 : 0,
      maxHp: 100 + G.vitalLv * 22,
      regen: G.vitalLv * 1.6
    };
  }

  function hitStop(ms) {
    if (REDUCE || G.demo) return;
    if (autoOn && autoSpeed >= 3) return;
    const s = ms / 1000;
    G.stop = Math.min(0.082, Math.max(G.stop, s));
  }

  function kick(dx, dy, mag) {
    if (REDUCE) return;
    const len = hypot(dx, dy) || 1;
    G.kickX += (dx / len) * mag;
    G.kickY += (dy / len) * mag;
    G.shake = Math.min(22, G.shake + mag * 0.42);
  }

  function addPunch(v) {
    if (REDUCE) return;
    G.punch = Math.max(G.punch, v);
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.42);
    G.flashRgb = rgb || MAG;
  }

  function burst(x, y, n, rgb, spd, rad) {
    for (let i = 0; i < n; i++) {
      const p = parts.alloc();
      if (!p) return;
      const a = rand(0, TAU);
      const v = rand(spd * 0.25, spd);
      p.x = x;
      p.y = y;
      p.vx = Math.cos(a) * v;
      p.vy = Math.sin(a) * v;
      p.life = rand(0.22, 0.55);
      p.max = p.life;
      p.r = rand(rad * 0.4, rad);
      p.rgb = rgb;
      p.g = rand(0, 40);
      p.k = 0;
    }
  }

  function sparkle(x, y, rgb) {
    const p = parts.alloc();
    if (!p) return;
    p.x = x;
    p.y = y;
    p.vx = rand(-20, 20);
    p.vy = rand(-40, -10);
    p.life = 0.18;
    p.max = 0.18;
    p.r = rand(2.2, 4.4);
    p.rgb = rgb;
    p.g = 0;
    p.k = 1;
  }

  function ringAt(x, y, r, vr, rgb, life, w) {
    const o = rings.alloc();
    if (!o) return null;
    o.x = x;
    o.y = y;
    o.r = r;
    o.vr = vr;
    o.life = life;
    o.max = life;
    o.rgb = rgb;
    o.w = w || 3;
    o.dmg = 0;
    o.from = 0;
    return o;
  }

  function stainAt(x, y, r, rgb) {
    if (stains.live.length >= MAX_STAIN) stains.kill(0);
    const s = stains.alloc();
    if (!s) return;
    s.x = x;
    s.y = y;
    s.r = r;
    s.life = rand(2.8, 5.2);
    s.rgb = rgb;
    s.a = rand(0.14, 0.28);
  }

  function floatNum(x, y, n, crit) {
    if (floats.live.length >= MAX_FLOAT) floats.kill(0);
    const f = floats.alloc();
    if (!f) return;
    f.x = x + rand(-6, 6);
    f.y = y;
    f.vy = crit ? -78 : -54;
    f.life = crit ? 0.85 : 0.62;
    f.text = crit ? '暴 ' + n : String(n);
    f.crit = crit ? 1 : 0;
    f.rgb = crit ? GOLD : WHITE;
  }

  function addBolt(pts, rgb) {
    if (bolts.live.length >= MAX_BOLT) bolts.kill(0);
    const b = bolts.alloc();
    if (!b) return;
    b.pts = pts;
    b.life = 0.14;
    b.rgb = rgb || CYN;
  }

  function jagged(ax, ay, bx, by) {
    const pts = [{ x: ax, y: ay }];
    const n = 4 + (Math.random() * 4) | 0;
    const dx = bx - ax;
    const dy = by - ay;
    const len = hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const j = (Math.random() - 0.5) * 26;
      pts.push({ x: ax + dx * t + nx * j, y: ay + dy * t + ny * j });
    }
    pts.push({ x: bx, y: by });
    return pts;
  }

  function toast(msg, kind) {
    toastTok += 1;
    const tok = toastTok;
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden', 'warn', 'gold');
    if (kind) toastEl.classList.add(kind);
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1400);
  }

  function banner(msg, kind, ms) {
    bannerTok += 1;
    const tok = bannerTok;
    bannerEl.textContent = msg;
    bannerEl.classList.remove('hidden', 'mag', 'cyan');
    if (kind) bannerEl.classList.add(kind);
    bannerEl.style.animation = 'none';
    void bannerEl.offsetWidth;
    bannerEl.style.animation = '';
    setTimeout(function () {
      if (tok === bannerTok) bannerEl.classList.add('hidden');
    }, ms || 1100);
  }

  function popKillHud() {
    killLabel.textContent = '噬 ' + G.kills;
    killLabel.classList.remove('pop');
    void killLabel.offsetWidth;
    killLabel.classList.add('pop');
  }

  function syncHud() {
    const st = stats();
    const hp = clamp(G.hp / st.maxHp, 0, 1);
    hpFill.style.transform = 'scaleX(' + hp + ')';
    xpFill.style.transform = 'scaleX(' + clamp(G.xp / Math.max(1, G.need), 0, 1) + ')';
    hpWrap.classList.toggle('low', hp < 0.32 && !G.demo && G.mode !== 'title');
    if (G.kind === 'eight' && (G.mode === 'play' || G.mode === 'pick' || G.mode === 'winning')) {
      timeLabel.textContent = fmtTime(G.left);
      timeLabel.classList.toggle('warn', G.left < 60);
    } else if (G.mode === 'play' || G.mode === 'pick' || G.mode === 'dying' || G.mode === 'winning') {
      timeLabel.textContent = fmtTime(G.survived);
      timeLabel.classList.remove('warn');
    } else if (G.selKind === 'eight') {
      timeLabel.textContent = '8:00';
      timeLabel.classList.remove('warn');
    } else {
      timeLabel.textContent = '0:00';
      timeLabel.classList.remove('warn');
    }
    killLabel.textContent = '噬 ' + G.kills;
    lvLabel.textContent = 'Lv ' + G.lv;
    const n = G.killQ.length;
    if (n >= 4 && (G.mode === 'play' || G.mode === 'winning')) {
      comboEl.textContent = '×' + n;
      comboEl.classList.remove('hidden');
      comboEl.classList.toggle('thunder', n >= 20);
    } else {
      comboEl.classList.add('hidden');
    }
  }

  function syncLoadout() {
    const rows = [];
    rows.push('<span>噬咬 <i>Lv' + G.biteLv + '</i></span>');
    if (G.spreadLv) rows.push('<span>扇噬 <i>Lv' + G.spreadLv + '</i></span>');
    if (G.orbitLv) rows.push('<span>环咬 <i>Lv' + G.orbitLv + '</i></span>');
    if (G.lightningLv) rows.push('<span>闪噬 <i>Lv' + G.lightningLv + '</i></span>');
    if (G.speedLv) rows.push('<span>疾走 <i>Lv' + G.speedLv + '</i></span>');
    if (G.magnetLv) rows.push('<span>磁噬 <i>Lv' + G.magnetLv + '</i></span>');
    if (G.vitalLv) rows.push('<span>血潮 <i>Lv' + G.vitalLv + '</i></span>');
    if (G.overflow) rows.push('<span>溢噬 <i>×' + G.overflow + '</i></span>');
    loadoutEl.innerHTML = rows.join('');
  }

  function syncModes() {
    modeEight.setAttribute('aria-pressed', G.selKind === 'eight' ? 'true' : 'false');
    modeEndless.setAttribute('aria-pressed', G.selKind === 'endless' ? 'true' : 'false');
    ovBest.textContent = bestText();
  }

  function setKind(k) {
    G.selKind = k;
    if (G.mode === 'title') G.kind = k;
    syncModes();
    syncHud();
    if (G.mode === 'play' || G.mode === 'pick') toast('下局 ' + (k === 'eight' ? '八分钟' : '无尽'));
  }

  function seedWorld() {
    decals.length = 0;
    motes.length = 0;
    for (let i = 0; i < 46; i++) {
      decals.push({
        x: rand(80, WORLD - 80),
        y: rand(80, WORLD - 80),
        r: rand(16, 78),
        a: rand(0, TAU),
        k: i % 4
      });
    }
    for (let i = 0; i < 70; i++) {
      motes.push({
        x: rand(0, WORLD),
        y: rand(0, WORLD),
        s: rand(0.6, 2.1),
        v: rand(4, 14),
        c: i % 3 === 0 ? CYN : MAG
      });
    }
  }

  function rebuildOrbs() {
    const n = G.orbitLv <= 0 ? 0 : Math.min(6, 1 + G.orbitLv);
    orbs.length = n;
    for (let i = 0; i < n; i++) {
      orbs[i] = { a: (TAU * i) / n, x: P.x, y: P.y };
    }
  }

  function cullFarthest(need) {
    while (enemies.live.length + need > MAX_ENEMY) {
      let far = 0;
      let fd = -1;
      for (let i = 0; i < enemies.live.length; i++) {
        const e = enemies.live[i];
        if (e.type === 'boss' || e.dying) continue;
        const d = hypot(e.x - P.x, e.y - P.y);
        if (d > fd) { fd = d; far = i; }
      }
      if (fd < 0) break;
      enemies.kill(far);
    }
  }

  function spawnEnemy(type, x, y) {
    if (type !== 'boss' && enemies.live.length >= MAX_ENEMY) cullFarthest(1);
    if (enemies.live.length >= MAX_ENEMY) return null;
    const spec = TYPES[type] || TYPES.swarm;
    const e = enemies.alloc();
    if (!e) return null;
    const sc = hpScale();
    e.type = spec.id;
    e.x = x;
    e.y = y;
    e.vx = 0;
    e.vy = 0;
    e.kx = 0;
    e.ky = 0;
    e.r = spec.r;
    e.max = spec.hp * sc * (type === 'boss' ? (1 + G.bossN * 0.42) : 1);
    if (type === 'boss') e.max = (380 + 130 * G.bossN) * sc;
    e.hp = e.max;
    e.spd = spec.spd * rand(0.92, 1.08);
    e.dmg = spec.dmg;
    e.xp = spec.xp;
    e.rgb = spec.rgb;
    e.mass = spec.mass;
    e.seed = rand(0, TAU);
    e.flash = 0;
    e.sq = 1;
    e.dying = 0;
    e.bid = 0;
    e.orbT = 0;
    e.phase = 'move';
    e.atk = rand(1.2, 2.4);
    e.dash = 0;
    e.ring = 0;
    e.face = 0;
    e.w0 = rand(0, TAU);
    e.wf = rand(1.4, 3.2);
    return e;
  }

  function spawnAtEdge(type) {
    const vw = W / zoom;
    const vh = H / zoom;
    const side = (Math.random() * 4) | 0;
    let x;
    let y;
    const pad = 36;
    if (side === 0) { x = camX - pad; y = camY + rand(0, vh); }
    else if (side === 1) { x = camX + vw + pad; y = camY + rand(0, vh); }
    else if (side === 2) { x = camX + rand(0, vw); y = camY - pad; }
    else { x = camX + rand(0, vw); y = camY + vh + pad; }
    x = clamp(x, MARGIN, WORLD - MARGIN);
    y = clamp(y, MARGIN, WORLD - MARGIN);
    return spawnEnemy(type, x, y);
  }

  function rollType() {
    const t = G.survived;
    const r = Math.random();
    if (t > 150 && r < 0.07) return 'elite';
    if (t > 38 && r < 0.16) return 'brute';
    if (t > 68 && r < 0.2) return 'runner';
    return 'swarm';
  }

  function spawnRate() {
    const t = G.survived;
    return 1.5 + t * 0.016 + (t > 120 ? 1.2 : 0) + (t > 240 ? 1.6 : 0) + (t > 360 ? 2 : 0);
  }

  function dropGem(x, y, v, rgb) {
    if (gems.live.length >= MAX_GEM) {
      collectGem(gems.live[0], true);
      gems.kill(0);
    }
    const g = gems.alloc();
    if (!g) return;
    g.x = x;
    g.y = y;
    g.vx = rand(-40, 40);
    g.vy = rand(-40, 40);
    g.v = v;
    g.life = 18;
    g.rgb = rgb || (v >= 8 ? GOLD : v >= 3 ? PINK : CYN);
    g.r = v >= 8 ? 8 : v >= 3 ? 6.2 : 4.8;
    g.pull = 0;
  }

  function collectGem(g, silent) {
    if (!g.on) return;
    G.xp += g.v;
    if (!silent) {
      if (G.gemSfx < 3) audio.gem();
      G.gemSfx += 1;
      sparkle(g.x, g.y, g.rgb);
    }
    g.on = 0;
    while (G.xp >= G.need && !G.demo) {
      G.xp -= G.need;
      G.lv += 1;
      G.need = xpFor(G.lv);
      G.pending += 1;
      lvLabel.textContent = 'Lv ' + G.lv;
      lvLabel.classList.remove('pop');
      void lvLabel.offsetWidth;
      lvLabel.classList.add('pop');
    }
  }

  function noteKill() {
    G.kills += 1;
    G.killQ.push(G.t);
    while (G.killQ.length && G.t - G.killQ[0] > 1) G.killQ.shift();
    const n = G.killQ.length;
    if (n >= 5) {
      comboEl.textContent = '×' + n;
      comboEl.classList.remove('hidden');
      comboEl.classList.toggle('thunder', n >= 20);
      comboEl.classList.remove('pop');
      void comboEl.offsetWidth;
      comboEl.classList.add('pop');
    }
    if (n >= 20 && G.t - G.thunderAt > 1.05) thunder();
    popKillHud();
  }

  function thunder() {
    G.thunderAt = G.t;
    screenFlash(GOLD, 0.72);
    addPunch(1.07);
    if (!REDUCE) G.shake = 18;
    hitStop(72);
    audio.thunder();
    ringAt(P.x, P.y, 20, 520, GOLD, 0.42, 6);
    ringAt(P.x, P.y, 8, 380, MAG, 0.36, 4);
    burst(P.x, P.y, 28, GOLD, 380, 4.2);
    banner('雷噬 ×' + G.killQ.length, '', 900);
    toast('潮碎', 'gold');
  }

  function killEnemy(e, crit) {
    if (e.dying) return;
    e.dying = 0.18;
    e.hp = 0;
    noteKill();
    const n = e.type === 'boss' ? 28 : e.type === 'brute' ? 16 : 10;
    burst(e.x, e.y, n, e.rgb, crit ? 320 : 240, e.r * 0.35);
    burst(e.x, e.y, 6, WHITE, 180, 2.2);
    ringAt(e.x, e.y, e.r, 220, e.rgb, 0.28, 3);
    stainAt(e.x, e.y, e.r * 1.4, e.rgb);
    dropGem(e.x, e.y, e.xp + (e.type === 'boss' ? 10 : 0), e.type === 'boss' ? GOLD : e.xp >= 3 ? PINK : CYN);
    kick(e.x - P.x, e.y - P.y, e.type === 'boss' ? 14 : 4.5);
    audio.kill(G.killQ.length);
    if (e.type === 'boss') {
      G.bossAlive = false;
      G.bossHp = 0;
      banner('潮主倒下', 'cyan', 1200);
      audio.win();
      screenFlash(CYN, 0.55);
      hitStop(80);
      for (let i = 0; i < enemies.live.length; i++) {
        const o = enemies.live[i];
        if (o === e || o.dying || o.type === 'boss') continue;
        if (hypot(o.x - e.x, o.y - e.y) < 200) {
          hurtEnemy(o, 80, e.x, e.y, { crit: true, silent: true });
        }
      }
    }
  }

  function hurtEnemy(e, dmg, srcX, srcY, opts) {
    if (!e.on || e.dying) return;
    opts = opts || {};
    const st = stats();
    const crit = opts.crit != null ? opts.crit : Math.random() < st.crit;
    let d = dmg;
    if (crit) d = (d * 2.2 + 0.5) | 0;
    else d = (d + 0.5) | 0;
    e.hp -= d;
    e.flash = 1;
    e.sq = crit ? 1.32 : 1.18;
    const dx = e.x - srcX;
    const dy = e.y - srcY;
    const len = hypot(dx, dy) || 1;
    const kb = (crit ? 110 : 48) / e.mass;
    e.kx += (dx / len) * kb;
    e.ky += (dy / len) * kb;
    floatNum(e.x, e.y - e.r, d, crit);
    burst(e.x, e.y, crit ? 7 : 3, crit ? GOLD : e.rgb, crit ? 210 : 130, crit ? 3 : 2);
    sparkle(e.x, e.y, crit ? GOLD : WHITE);
    kick(dx, dy, crit ? 6.5 : 2.6);
    addPunch(crit ? 1.03 : 1.01);
    if (crit) {
      screenFlash(GOLD, 0.18);
      hitStop(46);
    }
    if (!opts.silent) audio.hit(crit, G.hitsThis);
    G.hitsThis += 1;
    if (e.hp <= 0) killEnemy(e, crit);
  }

  function hurtPlayer(e) {
    if (G.demo || G.iFrame > 0 || G.mode !== 'play') return;
    const st = stats();
    G.hp -= e.dmg;
    G.iFrame = 0.62;
    G.hurt = 1;
    G.regenT = 0;
    hpTok += 1;
    const tok = hpTok;
    hpWrap.classList.add('hit');
    setTimeout(function () { if (tok === hpTok) hpWrap.classList.remove('hit'); }, 180);
    const dx = P.x - e.x;
    const dy = P.y - e.y;
    const len = hypot(dx, dy) || 1;
    P.vx += (dx / len) * 220;
    P.vy += (dy / len) * 220;
    burst(P.x, P.y, 14, CYN, 260, 3.2);
    ringAt(P.x, P.y, 10, 180, MAG, 0.28, 3);
    screenFlash(HOT, 0.45);
    hitStop(58);
    kick(-dx, -dy, 10);
    audio.hurt();
    if (G.hp <= 0) {
      G.hp = 0;
      beginDie();
    }
  }

  function nearestEnemy(x, y, maxD, skip) {
    let best = null;
    let bd = maxD * maxD;
    for (let i = 0; i < enemies.live.length; i++) {
      const e = enemies.live[i];
      if (!e.on || e.dying || e === skip) continue;
      const dx = e.x - x;
      const dy = e.y - y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bd) { bd = d2; best = e; }
    }
    return best;
  }

  function fireShot(ang, kind) {
    const st = stats();
    const b = bullets.alloc();
    if (!b) return;
    const spd = kind === 'spread' ? 540 : 580;
    b.x = P.x + Math.cos(ang) * 16;
    b.y = P.y + Math.sin(ang) * 16;
    b.vx = Math.cos(ang) * spd;
    b.vy = Math.sin(ang) * spd;
    b.r = kind === 'spread' ? 4.4 : 5.4;
    b.dmg = kind === 'spread' ? st.dmg * 0.72 : st.dmg;
    b.life = 0.62;
    b.id = ++seq;
    b.pierce = st.pierce;
    b.kind = kind;
    sparkle(b.x, b.y, kind === 'spread' ? MAG : CYN);
  }

  function autoFire() {
    const st = stats();
    const e = nearestEnemy(P.x, P.y, 520, null);
    if (!e) return;
    const ang = Math.atan2(e.y - P.y, e.x - P.x);
    P.face = lerp(P.face, ang, 0.35);
    fireShot(ang, 'bite');
    if (G.spreadLv > 0) {
      const n = G.spreadLv >= 3 ? 4 : 2;
      const span = 0.22 + G.spreadLv * 0.05;
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0 : (i / (n - 1) - 0.5);
        fireShot(ang + t * span * 2, 'spread');
      }
    }
    G.muzzle = 1;
    G.fireCd = st.cd;
    audio.shot();
  }

  function doZap() {
    const lv = G.lightningLv;
    if (lv <= 0) return;
    const range = 170 + lv * 28;
    let cur = nearestEnemy(P.x, P.y, range, null);
    if (!cur) return;
    const hops = 1 + lv;
    const seen = [];
    const st = stats();
    const dmg = (14 + lv * 6) * (1 + 0.12 * G.overflow);
    let ax = P.x;
    let ay = P.y;
    audio.zap();
    screenFlash(CYN, 0.22);
    kick(cur.x - P.x, cur.y - P.y, 5);
    hitStop(36);
    for (let h = 0; h < hops; h++) {
      if (!cur) break;
      seen.push(cur);
      addBolt(jagged(ax, ay, cur.x, cur.y), h % 2 ? MAG : CYN);
      hurtEnemy(cur, dmg, ax, ay, { crit: h === 0 ? Math.random() < st.crit + 0.12 : Math.random() < st.crit });
      ax = cur.x;
      ay = cur.y;
      const nextR = 88 + lv * 14;
      let nxt = null;
      let bd = nextR * nextR;
      for (let i = 0; i < enemies.live.length; i++) {
        const e = enemies.live[i];
        if (!e.on || e.dying || seen.indexOf(e) >= 0) continue;
        const dx = e.x - ax;
        const dy = e.y - ay;
        const d2 = dx * dx + dy * dy;
        if (d2 < bd) { bd = d2; nxt = e; }
      }
      cur = nxt;
    }
  }

  function applyUpgrade(id) {
    if (id === 'bite') G.biteLv = Math.min(5, G.biteLv + 1);
    else if (id === 'spread') G.spreadLv = Math.min(5, G.spreadLv + 1);
    else if (id === 'orbit') {
      G.orbitLv = Math.min(5, G.orbitLv + 1);
      rebuildOrbs();
    } else if (id === 'lightning') G.lightningLv = Math.min(5, G.lightningLv + 1);
    else if (id === 'speed') G.speedLv = Math.min(5, G.speedLv + 1);
    else if (id === 'magnet') G.magnetLv = Math.min(5, G.magnetLv + 1);
    else if (id === 'vital') {
      G.vitalLv = Math.min(5, G.vitalLv + 1);
      const st = stats();
      G.maxHp = st.maxHp;
      G.hp = Math.min(st.maxHp, G.hp + 22);
    } else if (id === 'overflow') G.overflow += 1;
    G.maxHp = stats().maxHp;
    audio.pick();
    screenFlash(CYN, 0.28);
    addPunch(1.04);
    ringAt(P.x, P.y, 12, 240, CYN, 0.3, 3);
    syncLoadout();
    syncHud();
  }

  function levelOf(id) {
    if (id === 'bite') return G.biteLv;
    if (id === 'spread') return G.spreadLv;
    if (id === 'orbit') return G.orbitLv;
    if (id === 'lightning') return G.lightningLv;
    if (id === 'speed') return G.speedLv;
    if (id === 'magnet') return G.magnetLv;
    if (id === 'vital') return G.vitalLv;
    return G.overflow;
  }

  function openPick() {
    if (G.mode !== 'play') return;
    G.mode = 'pick';
    audio.level();
    banner('噬力提升', 'cyan', 700);
    const pool = [];
    for (let i = 0; i < UPGRADES.length; i++) {
      const u = UPGRADES[i];
      if (levelOf(u.id) < u.max) pool.push(u);
    }
    for (let i = pool.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }
    const chosen = pool.slice(0, 3);
    while (chosen.length < 3) {
      chosen.push({
        id: 'overflow',
        name: '溢噬',
        tag: '改装',
        line: ['伤害 +12%，暴击 +4%']
      });
    }
    G.pickIds = chosen.map(function (u) { return u.id; });
    picksEl.innerHTML = '';
    for (let i = 0; i < chosen.length; i++) {
      const u = chosen[i];
      const lv = levelOf(u.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'card-up';
      btn.setAttribute('data-i', String(i));
      const line = u.id === 'overflow'
        ? '伤害 +12%，暴击 +4%'
        : (u.line[Math.min(u.line.length - 1, lv)] || u.line[0]);
      const lvTxt = u.id === 'overflow' ? '溢出' : (lv <= 0 ? '新' : 'Lv' + (lv + 1));
      btn.innerHTML = '<span class="tag">' + u.tag + ' · ' + lvTxt + '</span><h3>' + u.name + '</h3><p>' + line + '</p><span class="key">' + (i + 1) + '</span>';
      btn.addEventListener('click', function () { choosePick(i); });
      picksEl.appendChild(btn);
    }
    pickEl.classList.remove('hidden');
    autoPickT = 0;
  }

  function upgradeScore(id) {
    const lv = levelOf(id);
    const hpFrac = G.hp / Math.max(1, G.maxHp);
    let s = 0;
    if (id === 'bite') s = 100 + (lv < 3 ? 10 : 0);
    else if (id === 'orbit') s = lv <= 0 ? 118 : 88;
    else if (id === 'lightning') s = lv <= 0 ? 112 : 86;
    else if (id === 'spread') s = lv <= 0 ? 94 : 80;
    else if (id === 'overflow') s = 78;
    else if (id === 'magnet') s = lv <= 0 ? 96 : 72;
    else if (id === 'speed') s = lv <= 0 ? 62 : 48;
    else if (id === 'vital') {
      s = 38;
      if (hpFrac < 0.42) s += 48;
      if (hpFrac < 0.26) s += 36;
    }
    if (lv >= 4 && id !== 'overflow') s += 6;
    return s;
  }

  function bestPickIndex() {
    let bi = 0;
    let bs = -1e9;
    for (let i = 0; i < G.pickIds.length; i++) {
      const s = upgradeScore(G.pickIds[i]);
      if (s > bs) {
        bs = s;
        bi = i;
      }
    }
    return bi;
  }

  function choosePick(i) {
    if (G.mode !== 'pick') return;
    const id = G.pickIds[i];
    if (!id) return;
    applyUpgrade(id);
    pickEl.classList.add('hidden');
    G.pending = Math.max(0, G.pending - 1);
    autoPickT = 0;
    if (G.pending > 0) openPick();
    else G.mode = 'play';
  }

  function spawnBoss() {
    G.bossN += 1;
    G.bossAt += 120;
    G.warnBoss = false;
    cullFarthest(4);
    const e = spawnAtEdge('boss');
    if (!e) return;
    G.bossAlive = true;
    G.bossHp = e.hp;
    G.bossMax = e.max;
    banner('潮主降临', 'mag', 1400);
    toast('大潮来了', 'warn');
    audio.boss();
    screenFlash(MAG, 0.4);
    if (!REDUCE) G.shake = 12;
    hitStop(70);
    ringAt(e.x, e.y, 10, 160, MAG, 0.5, 5);
  }

  function ringSwarm() {
    const n = Math.min(14, 8 + (G.survived / 90) | 0);
    cullFarthest(n);
    const rad = 340;
    for (let i = 0; i < n; i++) {
      const a = (TAU * i) / n + rand(-0.08, 0.08);
      spawnEnemy(rollType(), P.x + Math.cos(a) * rad, P.y + Math.sin(a) * rad);
    }
    banner('合围', 'mag', 800);
    audio.warn();
    if (!REDUCE) G.shake = 8;
    kick(1, 0, 6);
  }

  function scoreMove(nx, ny, dx, dy, st) {
    let score = 0;
    const lo = MARGIN + PLAYER_R + 8;
    const hi = WORLD - MARGIN - PLAYER_R - 8;
    const wall = Math.min(nx - lo, hi - nx, ny - lo, hi - ny);
    if (wall < 110) score -= (110 - wall) * (110 - wall) * 0.55;
    if (wall < 36) score -= 14000;
    const cx = WORLD * 0.5;
    const cy = WORLD * 0.5;
    const rdx = nx - cx;
    const rdy = ny - cy;
    const rd = hypot(rdx, rdy) || 1;
    score -= Math.abs(rd - 640) * 0.42;
    score += autoOrbit * (dx * -rdy + dy * rdx) / rd * 260;

    const live = enemies.live;
    let closest = 1e9;
    let nearX = 0;
    let nearY = 0;
    let nearN = 0;
    let dens = 0;
    let huntX = 0;
    let huntY = 0;
    let huntD = 1e9;
    for (let i = 0; i < live.length; i++) {
      const e = live[i];
      if (!e.on || e.dying) continue;
      const ex = e.x + e.vx * 0.18;
      const ey = e.y + e.vy * 0.18;
      const edx = ex - nx;
      const edy = ey - ny;
      const d = hypot(edx, edy) || 1;
      const mass = e.mass || 1;
      if (d < closest) {
        closest = d;
        huntX = edx;
        huntY = edy;
        huntD = d;
      }
      if (d < 230) {
        nearX += edx;
        nearY += edy;
        nearN += 1;
      }
      const danger = e.r + PLAYER_R + (e.type === 'runner' ? 28 : 16);
      if (d < danger + 70) score -= (24000 * mass) / Math.max(10, d - e.r * 0.4);
      if (d < 88) score -= 18000 * mass;
      if (e.type === 'boss') {
        score -= 9000 / Math.max(24, d);
        if (e.phase === 'wind' || e.phase === 'dash') {
          const bx = P.x - e.x;
          const by = P.y - e.y;
          const bd = hypot(bx, by) || 1;
          const side = dx * (-by / bd) + dy * (bx / bd);
          const along = dx * (bx / bd) + dy * (by / bd);
          score += Math.abs(side) * (e.phase === 'dash' ? 2800 : 1600);
          score -= Math.max(0, along) * 900;
        }
      }
      const ahead = dx * edx + dy * edy;
      if (ahead > 0 && d < 170) dens += mass / d;
    }
    score -= dens * 1100;

    if (nearN > 0) {
      const nd = hypot(nearX, nearY) || 1;
      const away = -(nearX / nd) * dx - (nearY / nd) * dy;
      const side = (-nearY / nd) * dx + (nearX / nd) * dy;
      if (closest < 70) score += away * 5200;
      else if (closest < 210) {
        score += Math.abs(side) * 1400;
        score += away * 900;
        score += autoOrbit * side * 700;
      }
    }

    if (closest < 48) score -= 90000;
    if (closest > 80 && closest < 280) score += 220;
    if (closest > 300) score -= (closest - 300) * 2.4;
    if (closest > 460) score -= (closest - 460) * 8;
    if (huntD < 1e8 && closest > 200) {
      score += (huntX * dx + huntY * dy) / huntD * 640;
    }

    const hpFrac = G.hp / Math.max(1, G.maxHp);
    const panic = closest < 44 || (hpFrac < 0.3 && closest < 96);
    const mag = st.mag;
    if (!panic) {
      const gemsLive = gems.live;
      for (let i = 0; i < gemsLive.length; i++) {
        const g = gemsLive[i];
        const gx = g.x - nx;
        const gy = g.y - ny;
        const gd = hypot(gx, gy) || 1;
        let threat = 0;
        for (let j = 0; j < live.length; j++) {
          const e = live[j];
          if (!e.on || e.dying) continue;
          const td = hypot(e.x - g.x, e.y - g.y);
          if (td < 70) threat += 1;
          if (threat > 4) break;
        }
        const urgent = g.life < 4 ? 2.4 : g.v >= 8 ? 1.6 : 1;
        const w = (g.v * 62 * urgent) / (gd + 28);
        score += w * (threat > 3 ? 0.12 : 1);
        if (gd < mag + 20) score += g.v * 3;
        if (closest > 90) score += (gx * dx + gy * dy) / gd * w * 0.35;
      }
    }

    const ringsLive = rings.live;
    for (let i = 0; i < ringsLive.length; i++) {
      const r = ringsLive[i];
      if (!r.dmg || !r.from) continue;
      const d = hypot(nx - r.x, ny - r.y);
      const band = Math.abs(d - (r.r + r.vr * 0.2));
      if (band < 26) score -= 22000;
    }

    const spdNow = hypot(P.vx, P.vy);
    if (spdNow > 24) score += (dx * P.vx + dy * P.vy) / spdNow * 320;
    return score;
  }

  function autoThink() {
    const st = stats();
    const look = 0.22;
    const reach = st.spd * look;
    let bestX = autoDir.x;
    let bestY = autoDir.y;
    let bestS = -1e15;
    const n = 16;
    for (let i = 0; i < n; i++) {
      const a = (TAU * i) / n;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      const nx = clamp(P.x + dx * reach, MARGIN + PLAYER_R, WORLD - MARGIN - PLAYER_R);
      const ny = clamp(P.y + dy * reach, MARGIN + PLAYER_R, WORLD - MARGIN - PLAYER_R);
      const s = scoreMove(nx, ny, dx, dy, st);
      if (s > bestS) {
        bestS = s;
        bestX = dx;
        bestY = dy;
      }
    }
    const spdNow = hypot(P.vx, P.vy);
    if (spdNow > 28) {
      const dx = P.vx / spdNow;
      const dy = P.vy / spdNow;
      const nx = clamp(P.x + dx * reach, MARGIN + PLAYER_R, WORLD - MARGIN - PLAYER_R);
      const ny = clamp(P.y + dy * reach, MARGIN + PLAYER_R, WORLD - MARGIN - PLAYER_R);
      const s = scoreMove(nx, ny, dx, dy, st) + 36;
      if (s > bestS) {
        bestS = s;
        bestX = dx;
        bestY = dy;
      }
    }
    autoDir.x = bestX;
    autoDir.y = bestY;
    const toC = { x: P.x - WORLD * 0.5, y: P.y - WORLD * 0.5 };
    const tang = autoOrbit * (-toC.y * bestX + toC.x * bestY);
    if (tang < -0.15) {
      autoOrbitHold += 1;
      if (autoOrbitHold > 18) {
        autoOrbit *= -1;
        autoOrbitHold = 0;
      }
    } else {
      autoOrbitHold = 0;
    }
  }

  function wishDir() {
    if (autoOn && G.mode === 'play' && !G.demo) {
      return autoDir;
    }
    let x = 0;
    let y = 0;
    if (keys.l) x -= 1;
    if (keys.r) x += 1;
    if (keys.u) y -= 1;
    if (keys.d) y += 1;
    x += pad.x + vpad.x;
    y += pad.y + vpad.y;
    if (mouse.down && !vpad.active) {
      const dx = mouse.wx - P.x;
      const dy = mouse.wy - P.y;
      const d = hypot(dx, dy);
      if (d > 10) {
        x += dx / d;
        y += dy / d;
      }
    }
    const d = hypot(x, y);
    if (d > 1) { x /= d; y /= d; }
    return { x: x, y: y };
  }

  function readPad() {
    pad.x = 0;
    pad.y = 0;
    pad.a = false;
    pad.start = false;
    let list = [];
    try { list = navigator.getGamepads ? navigator.getGamepads() : []; } catch (e) { list = []; }
    for (let i = 0; i < list.length; i++) {
      const g = list[i];
      if (!g) continue;
      if (Math.abs(g.axes[0]) > 0.18) pad.x += g.axes[0];
      if (Math.abs(g.axes[1]) > 0.18) pad.y += g.axes[1];
      const b = g.buttons;
      if (b[14] && b[14].pressed) pad.x -= 1;
      if (b[15] && b[15].pressed) pad.x += 1;
      if (b[12] && b[12].pressed) pad.y -= 1;
      if (b[13] && b[13].pressed) pad.y += 1;
      if (b[0] && b[0].pressed) pad.a = true;
      if (b[9] && b[9].pressed) pad.start = true;
    }
    const aEdge = pad.a && !pad.aPrev;
    const sEdge = pad.start && !pad.startPrev;
    pad.aPrev = pad.a;
    pad.startPrev = pad.start;
    if (aEdge || sEdge) {
      audio.ensure();
      if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') start();
      else if (G.mode === 'pick' && !autoOn) choosePick(0);
    }
  }

  function updateCam() {
    const vw = W / zoom;
    const vh = H / zoom;
    const jx = REDUCE ? 0 : (Math.sin(G.clock * 67) + Math.sin(G.clock * 91)) * 0.5 * G.shake;
    const jy = REDUCE ? 0 : (Math.cos(G.clock * 73) + Math.sin(G.clock * 53)) * 0.5 * G.shake;
    camX = P.x - vw * 0.5 + G.kickX + jx;
    camY = P.y - vh * 0.5 + G.kickY + jy;
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - 22 * dt);
    G.kickX += -G.kickX * 11 * dt;
    G.kickY += -G.kickY * 11 * dt;
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0008, dt));
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.hurt = Math.max(0, G.hurt - dt * 1.8);
    G.muzzle = Math.max(0, G.muzzle - dt * 8);
    G.iFrame = Math.max(0, G.iFrame - dt);
    for (let i = parts.live.length - 1; i >= 0; i--) {
      const p = parts.live[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      p.vx *= 0.98;
      if (p.life <= 0) parts.kill(i);
    }
    for (let i = floats.live.length - 1; i >= 0; i--) {
      const f = floats.live[i];
      f.life -= dt;
      f.y += f.vy * dt;
      f.vy *= 0.96;
      if (f.life <= 0) floats.kill(i);
    }
    for (let i = rings.live.length - 1; i >= 0; i--) {
      const r = rings.live[i];
      r.life -= dt;
      r.r += r.vr * dt;
      if (r.dmg && r.from && G.mode === 'play' && !G.demo) {
        const d = hypot(P.x - r.x, P.y - r.y);
        if (Math.abs(d - r.r) < 14 && G.iFrame <= 0) {
          const fake = { dmg: r.dmg, x: r.x, y: r.y };
          hurtPlayer(fake);
          r.dmg = 0;
        }
      }
      if (r.life <= 0) rings.kill(i);
    }
    for (let i = bolts.live.length - 1; i >= 0; i--) {
      bolts.live[i].life -= dt;
      if (bolts.live[i].life <= 0) bolts.kill(i);
    }
    for (let i = stains.live.length - 1; i >= 0; i--) {
      stains.live[i].life -= dt;
      if (stains.live[i].life <= 0) stains.kill(i);
    }
    for (let i = 0; i < motes.length; i++) {
      motes[i].y -= motes[i].v * dt;
      if (motes[i].y < 0) motes[i].y += WORLD;
    }
  }

  function updateGems(dt) {
    const st = stats();
    const mag = G.demo ? 220 : st.mag;
    for (let i = gems.live.length - 1; i >= 0; i--) {
      const g = gems.live[i];
      g.life -= dt;
      const dx = P.x - g.x;
      const dy = P.y - g.y;
      const d = hypot(dx, dy);
      if (d < mag + 40 || g.pull) {
        g.pull = 1;
        const pull = 520 + G.magnetLv * 90;
        g.vx += (dx / (d || 1)) * pull * dt;
        g.vy += (dy / (d || 1)) * pull * dt;
      }
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.vx *= 0.9;
      g.vy *= 0.9;
      if (d < PLAYER_R + g.r + 4) {
        collectGem(g, false);
        gems.kill(i);
        continue;
      }
      if (g.life <= 0) gems.kill(i);
    }
    if (G.pending > 0 && G.mode === 'play' && !G.demo) openPick();
  }

  function updateBullets(dt) {
    for (let i = bullets.live.length - 1; i >= 0; i--) {
      const b = bullets.live[i];
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.life <= 0) { bullets.kill(i); continue; }
      let dead = false;
      for (let j = 0; j < enemies.live.length; j++) {
        const e = enemies.live[j];
        if (!e.on || e.dying || e.bid === b.id) continue;
        const dx = e.x - b.x;
        const dy = e.y - b.y;
        if (dx * dx + dy * dy < (e.r + b.r) * (e.r + b.r)) {
          e.bid = b.id;
          hurtEnemy(e, b.dmg, b.x - b.vx * 0.05, b.y - b.vy * 0.05, {});
          b.pierce -= 1;
          if (b.pierce < 0) { dead = true; break; }
        }
      }
      if (dead) bullets.kill(i);
    }
  }

  function updateOrbs(dt) {
    if (G.orbitLv <= 0) return;
    const n = orbs.length;
    const rad = 48 + G.orbitLv * 7;
    const spin = 2.4 + G.orbitLv * 0.35;
    const st = stats();
    const dmg = (8 + G.orbitLv * 4) * (1 + 0.12 * G.overflow);
    for (let i = 0; i < n; i++) {
      const o = orbs[i];
      o.a += spin * dt;
      o.x = P.x + Math.cos(o.a) * rad;
      o.y = P.y + Math.sin(o.a) * rad;
      if (Math.random() < dt * 8) sparkle(o.x, o.y, i % 2 ? MAG : CYN);
      for (let j = 0; j < enemies.live.length; j++) {
        const e = enemies.live[j];
        if (!e.on || e.dying) continue;
        if (G.t < e.orbT) continue;
        const dx = e.x - o.x;
        const dy = e.y - o.y;
        if (dx * dx + dy * dy < (e.r + 8) * (e.r + 8)) {
          e.orbT = G.t + 0.26;
          hurtEnemy(e, dmg, P.x, P.y, {});
        }
      }
    }
  }

  function updateEnemies(dt) {
    const live = enemies.live;
    for (let i = 0; i < live.length; i++) {
      const e = live[i];
      if (e.dying) {
        e.dying -= dt;
        e.sq = Math.max(0.05, e.sq - dt * 8);
        continue;
      }
      e.flash = Math.max(0, e.flash - dt * 7);
      e.sq = lerp(e.sq, 1, 1 - Math.pow(0.0002, dt));
      const dx = P.x - e.x;
      const dy = P.y - e.y;
      const d = hypot(dx, dy) || 1;
      e.face = Math.atan2(dy, dx);
      const wx = Math.cos(e.w0 + G.t * e.wf) * (e.type === 'runner' ? 28 : 16);
      const wy = Math.sin(e.w0 * 1.3 + G.t * e.wf) * (e.type === 'runner' ? 28 : 16);

      if (e.type === 'boss') {
        G.bossHp = e.hp;
        G.bossMax = e.max;
        e.atk -= dt;
        if (e.phase === 'move') {
          e.vx = (dx / d) * e.spd;
          e.vy = (dy / d) * e.spd;
          if (e.atk <= 0) {
            if (Math.random() < 0.45) {
              e.phase = 'wind';
              e.atk = 0.55;
              ringAt(e.x, e.y, e.r, 0, GOLD, 0.55, 4);
            } else {
              e.phase = 'pulse';
              e.atk = 0.4;
            }
          }
        } else if (e.phase === 'wind') {
          e.vx *= 0.85;
          e.vy *= 0.85;
          e.flash = 1;
          if (e.atk <= 0) {
            e.phase = 'dash';
            e.atk = 0.22;
            const s = 420;
            e.vx = (dx / d) * s;
            e.vy = (dy / d) * s;
            audio.warn();
          }
        } else if (e.phase === 'dash') {
          if (e.atk <= 0) { e.phase = 'move'; e.atk = 2.2; }
        } else if (e.phase === 'pulse') {
          e.vx *= 0.8;
          e.vy *= 0.8;
          if (e.atk <= 0) {
            const rg = ringAt(e.x, e.y, 20, 260, MAG, 1.15, 6);
            if (rg) { rg.dmg = e.dmg; rg.from = 1; }
            audio.boss();
            e.phase = 'move';
            e.atk = 2.6;
          }
        }
      } else {
        const spd = e.spd;
        e.vx = ((dx / d) * spd) + wx * 0.35;
        e.vy = ((dy / d) * spd) + wy * 0.35;
        if (e.type === 'elite' && d < 240 && ((G.t + e.seed) % 2.8) < dt * 2) {
          e.x += (dx / d) * 18;
          e.y += (dy / d) * 18;
        }
      }

      e.vx += e.kx;
      e.vy += e.ky;
      e.kx *= 0.78;
      e.ky *= 0.78;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.x = clamp(e.x, MARGIN, WORLD - MARGIN);
      e.y = clamp(e.y, MARGIN, WORLD - MARGIN);

      const hdx = P.x - e.x;
      const hdy = P.y - e.y;
      const hd = hypot(hdx, hdy) || 1;
      if (hd < e.r + PLAYER_R - 1) {
        if (G.mode === 'play' && !G.demo) hurtPlayer(e);
        else {
          const push = e.r + PLAYER_R + 2 - hd;
          e.x -= (hdx / hd) * push;
          e.y -= (hdy / hd) * push;
        }
      }
    }

    for (let i = 0; i < live.length; i++) {
      const a = live[i];
      if (a.dying) continue;
      for (let j = i + 1; j < live.length; j++) {
        const b = live[j];
        if (b.dying) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const min = a.r + b.r;
        const d2 = dx * dx + dy * dy;
        if (d2 > 0 && d2 < min * min) {
          const d = Math.sqrt(d2);
          const push = (min - d) * 0.5;
          const nx = dx / d;
          const ny = dy / d;
          const am = b.mass / (a.mass + b.mass);
          const bm = a.mass / (a.mass + b.mass);
          a.x -= nx * push * am;
          a.y -= ny * push * am;
          b.x += nx * push * bm;
          b.y += ny * push * bm;
        }
      }
    }

    for (let i = live.length - 1; i >= 0; i--) {
      if (live[i].dying && live[i].dying <= 0) enemies.kill(i);
    }
  }

  function updatePlayer(dt) {
    const st = stats();
    G.maxHp = st.maxHp;
    if (G.mode === 'play' || G.demo) {
      const w = wishDir();
      const k = 1 - Math.pow(0.0002, dt);
      P.vx = lerp(P.vx, w.x * st.spd, k);
      P.vy = lerp(P.vy, w.y * st.spd, k);
      const spd = hypot(P.vx, P.vy);
      if (spd > 18) P.face = Math.atan2(P.vy, P.vx);
      P.x = clamp(P.x + P.vx * dt, MARGIN + PLAYER_R, WORLD - MARGIN - PLAYER_R);
      P.y = clamp(P.y + P.vy * dt, MARGIN + PLAYER_R, WORLD - MARGIN - PLAYER_R);
      if (spd > 70 && Math.random() < dt * 16) {
        const p = parts.alloc();
        if (p) {
          p.x = P.x - Math.cos(P.face) * 8;
          p.y = P.y - Math.sin(P.face) * 8;
          p.vx = -P.vx * 0.15;
          p.vy = -P.vy * 0.15;
          p.life = 0.28;
          p.max = 0.28;
          p.r = 2.4;
          p.rgb = CYN;
          p.g = 0;
          p.k = 1;
        }
      }
      trail.push({ x: P.x, y: P.y, a: P.face, t: G.t });
      if (trail.length > 7) trail.shift();
    }

    if (G.mode === 'play' && !G.demo) {
      G.fireCd -= dt;
      if (G.fireCd <= 0) autoFire();
      G.zapCd -= dt;
      if (G.lightningLv > 0 && G.zapCd <= 0) {
        G.zapCd = 1.32 - G.lightningLv * 0.12;
        doZap();
      }
      if (G.hurt <= 0 && st.regen > 0) {
        G.regenT += dt;
        if (G.regenT > 2.2) G.hp = Math.min(st.maxHp, G.hp + st.regen * dt);
      }
      if (G.hp < st.maxHp * 0.28) {
        G.pulseHp += dt;
        if (G.pulseHp > 0.85) {
          G.pulseHp = 0;
          audio.beep(140, 0.08, 'sine', 0.03, 70);
        }
      }
    } else if (G.demo) {
      G.fireCd -= dt;
      if (G.fireCd <= 0) autoFire();
      G.zapCd -= dt;
      if (G.lightningLv > 0 && G.zapCd <= 0) {
        G.zapCd = 1.1;
        doZap();
      }
    }
  }

  function updateSpawns(dt) {
    if (G.mode !== 'play' && !G.demo) return;
    const cap = G.demo ? 28 : MAX_ENEMY;
    G.spawnAcc += spawnRate() * dt * (G.demo ? 0.7 : 1);
    while (G.spawnAcc >= 1) {
      G.spawnAcc -= 1;
      if (enemies.live.length < cap) spawnAtEdge(rollType());
    }
    if (!G.demo && G.survived >= G.bossAt && (G.kind === 'endless' || G.bossAt < EIGHT)) {
      spawnBoss();
    }
    if (!G.demo && G.survived >= G.nextRing) {
      G.nextRing += 52;
      ringSwarm();
    } else if (G.demo && G.t > 0.4 && enemies.live.length < 16) {
      spawnAtEdge('swarm');
    }
  }

  function beginDie() {
    G.mode = 'dying';
    G.endT = 0.82;
    G.why = '潮没';
    burst(P.x, P.y, 36, CYN, 420, 4.5);
    burst(P.x, P.y, 18, MAG, 280, 3);
    ringAt(P.x, P.y, 8, 380, MAG, 0.5, 6);
    screenFlash(HOT, 0.7);
    addPunch(1.08);
    hitStop(80);
    audio.lose();
    banner('噬尽', 'mag', 900);
  }

  function beginWin() {
    G.mode = 'winning';
    G.endT = 1.45;
    G.cascade = 0;
    G.why = '潮退';
    audio.win();
    banner('潮退', 'cyan', 1200);
    screenFlash(GOLD, 0.55);
    addPunch(1.06);
    hitStop(70);
    ringAt(P.x, P.y, 16, 420, GOLD, 0.6, 6);
  }

  function finishEnd() {
    saveBest();
    showEnd(G.mode === 'winning' || G.why === '潮退');
  }

  function showTitle() {
    G.mode = 'title';
    overlay.classList.remove('hidden');
    panel.classList.remove('win', 'lose');
    ovKicker.textContent = 'HORDE';
    ovTitle.textContent = '噬潮';
    ovLead.innerHTML = '一群涌上来，你边闪边打。<br />自动咬最近的，吃光点升级。';
    ovOps.textContent = 'WASD / 摇杆 / 虚拟键移动 · A 自动 · R 重开 · M 静音';
    ovBtn.textContent = '开噬';
    ovBest.textContent = bestText();
    hintEl.textContent = autoOn ? '自动托管 · A 停下 · 八分钟或死' : '闪着打 · 吃光点升级 · A 自动 · 八分钟或死';
    pickEl.classList.add('hidden');
  }

  function showEnd(win) {
    G.mode = win ? 'win' : 'lose';
    overlay.classList.remove('hidden');
    panel.classList.toggle('win', win);
    panel.classList.toggle('lose', !win);
    ovKicker.textContent = win ? 'CLEAR' : 'DOWN';
    ovTitle.textContent = win ? '潮退' : '潮没';
    const rec = G.newBest ? '<br />新纪录' : '';
    ovLead.innerHTML = (win ? '八分钟撑过去了。' : '被潮淹没。') +
      '<br />活过 ' + fmtTime(G.survived) + ' · 噬 ' + G.kills + ' · Lv ' + G.lv + rec;
    ovOps.textContent = 'A 自动 · R 再噬 · M 静音';
    ovBtn.textContent = '再噬';
    ovBest.textContent = bestText();
    hintEl.textContent = win ? '潮退了 · A 自动 · R 再来' : '倒了 · A 自动 · R 再噬';
  }

  function clearPools() {
    enemies.clear();
    bullets.clear();
    gems.clear();
    parts.clear();
    floats.clear();
    rings.clear();
    bolts.clear();
    stains.clear();
    trail.length = 0;
    G.killQ.length = 0;
  }

  function resetRun(demo) {
    clearPools();
    P.x = WORLD * 0.5;
    P.y = WORLD * 0.5;
    P.vx = 0;
    P.vy = 0;
    P.face = -0.6;
    G.demo = !!demo;
    G.t = 0;
    G.survived = 0;
    G.left = EIGHT;
    G.lv = 1;
    G.xp = 0;
    G.need = xpFor(1);
    G.pending = 0;
    G.kills = 0;
    G.overflow = 0;
    G.fireCd = 0.15;
    G.zapCd = 0.8;
    G.iFrame = 1.1;
    G.stop = 0;
    G.shake = 0;
    G.kickX = 0;
    G.kickY = 0;
    G.punch = 1;
    G.flash = 0;
    G.hurt = 0;
    G.muzzle = 0;
    G.bossAt = 120;
    G.bossN = 0;
    G.bossHp = 0;
    G.bossMax = 0;
    G.bossAlive = false;
    G.nextRing = 42;
    G.spawnAcc = 2;
    G.combo = 0;
    G.thunderAt = -9;
    G.hitsThis = 0;
    G.gemSfx = 0;
    G.regenT = 0;
    G.why = '';
    G.endT = 0;
    G.newBest = false;
    G.warn10 = false;
    G.warnBoss = false;
    G.kind = G.selKind;
    if (demo) {
      G.biteLv = 2;
      G.spreadLv = 1;
      G.orbitLv = 1;
      G.lightningLv = 1;
      G.speedLv = 1;
      G.magnetLv = 2;
      G.vitalLv = 0;
    } else {
      G.biteLv = 1;
      G.spreadLv = 0;
      G.orbitLv = 0;
      G.lightningLv = 0;
      G.speedLv = 0;
      G.magnetLv = 0;
      G.vitalLv = 0;
    }
    const st = stats();
    G.maxHp = st.maxHp;
    G.hp = st.maxHp;
    rebuildOrbs();
    syncLoadout();
    syncHud();
    pickEl.classList.add('hidden');
  }

  function start() {
    audio.ensure();
    audio.start();
    resetRun(false);
    G.mode = 'play';
    G.demo = false;
    overlay.classList.add('hidden');
    panel.classList.remove('win', 'lose');
    banner(G.kind === 'eight' ? '八分钟' : '无尽', 'cyan', 800);
    toast(G.kind === 'eight' ? '活过八分钟' : '能咬多久算多久');
    hintEl.textContent = autoOn
      ? '自动托管 · 绕潮吃光点 · A 停下 · R 重开'
      : 'WASD 闪 · 自动咬 · 1 2 3 升级 · A 自动 · R 重开';
    if (!REDUCE) G.shake = 6;
    addPunch(1.04);
    ringAt(P.x, P.y, 10, 280, CYN, 0.35, 3);
    canvas.focus();
  }

  function retry() {
    audio.ensure();
    if (G.mode === 'title') start();
    else start();
  }

  function update(dt) {
    G.clock += dt;
    G.hitsThis = 0;
    G.gemSfx = 0;
    readPad();

    if (G.mode === 'pick') {
      if (autoOn) {
        autoPickT += dt;
        if (autoPickT >= (AUTO_PICK_WAIT[autoSpeed] || 0)) {
          autoPickT = 0;
          choosePick(bestPickIndex());
        }
      }
      updateCam();
      updateFx(dt * 0.6);
      return;
    }

    if (G.mode === 'title') {
      if (autoOn) {
        autoOvWait += dt;
        if (autoOvWait >= (AUTO_START_WAIT[autoSpeed] || 0.2)) {
          autoOvWait = 0;
          start();
          return;
        }
      }
      if (!G.demo) resetRun(true);
      G.demo = true;
      G.t += dt;
      updatePlayer(dt);
      updateOrbs(dt);
      updateSpawns(dt);
      updateEnemies(dt);
      updateBullets(dt);
      updateGems(dt);
      G.hp = G.maxHp;
      updateCam();
      updateFx(dt);
      syncHud();
      return;
    }

    if (G.mode === 'play') {
      if (autoOn) autoThink();
      G.t += dt;
      G.survived += dt;
      if (G.kind === 'eight') {
        G.left = Math.max(0, EIGHT - G.survived);
        if (G.left <= 0) {
          beginWin();
          return;
        }
        if (G.left <= 10 && !G.warn10) {
          G.warn10 = true;
          toast('最后十秒', 'gold');
        }
      }
      if (!G.warnBoss && G.bossAt - G.survived <= 5 && G.bossAt - G.survived > 0 && (G.kind === 'endless' || G.bossAt < EIGHT)) {
        G.warnBoss = true;
        toast('潮主将近', 'warn');
        audio.warn();
      }
      updatePlayer(dt);
      updateOrbs(dt);
      updateSpawns(dt);
      updateEnemies(dt);
      updateBullets(dt);
      updateGems(dt);
      updateCam();
      updateFx(dt);
      syncHud();
      return;
    }

    if (G.mode === 'dying') {
      G.endT -= dt;
      P.vx *= 0.9;
      P.vy *= 0.9;
      updateEnemies(dt);
      updateBullets(dt);
      updateCam();
      updateFx(dt);
      if (G.endT <= 0) finishEnd();
      return;
    }

    if (G.mode === 'win' || G.mode === 'lose') {
      updateFx(dt);
      updateCam();
      return;
    }

    if (G.mode === 'winning') {
      G.endT -= dt;
      G.cascade += dt;
      while (G.cascade > 0.03 && enemies.live.length) {
        G.cascade -= 0.03;
        let idx = -1;
        let bd = 1e9;
        for (let i = 0; i < enemies.live.length; i++) {
          const e = enemies.live[i];
          if (e.dying) continue;
          const d = hypot(e.x - P.x, e.y - P.y);
          if (d < bd) { bd = d; idx = i; }
        }
        if (idx < 0) break;
        killEnemy(enemies.live[idx], true);
      }
      updateEnemies(dt);
      updateBullets(dt);
      updateGems(dt);
      updateCam();
      updateFx(dt);
      syncHud();
      if (G.endT <= 0) finishEnd();
    }
  }

  function diamondPath(x, y, r, rot) {
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    const pts = [[0, -r], [r * 0.7, 0], [0, r], [-r * 0.7, 0]];
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const px = x + pts[i][0] * c - pts[i][1] * s;
      const py = y + pts[i][0] * s + pts[i][1] * c;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function drawFloor() {
    ctx.fillStyle = '#08060f';
    ctx.fillRect(0, 0, W, H);
    const x0 = sx(MARGIN);
    const y0 = sy(MARGIN);
    const x1 = sx(WORLD - MARGIN);
    const y1 = sy(WORLD - MARGIN);
    ctx.fillStyle = '#0c0916';
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);

    const gs = 56;
    const c0 = ((camX / gs) | 0) - 1;
    const r0 = ((camY / gs) | 0) - 1;
    const c1 = (((camX + W / zoom) / gs) | 0) + 1;
    const r1 = (((camY + H / zoom) / gs) | 0) + 1;
    ctx.strokeStyle = 'rgba(255, 61, 138, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = c0; c <= c1; c++) {
      const x = sx(c * gs);
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
    }
    for (let r = r0; r <= r1; r++) {
      const y = sy(r * gs);
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    ctx.lineWidth = 2 * zoom;
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);

    for (let i = 0; i < decals.length; i++) {
      const d = decals[i];
      const x = sx(d.x);
      const y = sy(d.y);
      if (x < -80 || y < -80 || x > W + 80 || y > H + 80) continue;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(d.a);
      if (d.k === 0) {
        ctx.strokeStyle = 'rgba(255, 61, 138, 0.1)';
        ctx.lineWidth = 1.4 * zoom;
        ctx.beginPath();
        ctx.arc(0, 0, d.r * zoom, 0, TAU);
        ctx.stroke();
      } else if (d.k === 1) {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
        ctx.lineWidth = 1.2 * zoom;
        diamondPath(0, 0, d.r * 0.55 * zoom, 0);
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(255, 61, 184, 0.04)';
        ctx.beginPath();
        ctx.arc(0, 0, d.r * 0.4 * zoom, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = sx(m.x);
      const y = sy(m.y);
      if (x < -4 || y < -4 || x > W + 4 || y > H + 4) continue;
      ctx.fillStyle = rgba(m.c, 0.22);
      ctx.beginPath();
      ctx.arc(x, y, m.s * zoom, 0, TAU);
      ctx.fill();
    }

    for (let i = 0; i < stains.live.length; i++) {
      const s = stains.live[i];
      const a = s.a * clamp(s.life / 1.2, 0, 1);
      ctx.fillStyle = rgba(s.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * zoom, 0, TAU);
      ctx.fill();
    }
  }

  function drawGems() {
    for (let i = 0; i < gems.live.length; i++) {
      const g = gems.live[i];
      const blink = g.life < 2.2 ? (0.4 + 0.6 * ((g.life * 8) % 1)) : 1;
      const x = sx(g.x);
      const y = sy(g.y);
      ctx.save();
      ctx.globalAlpha = blink;
      ctx.fillStyle = rgba(g.rgb, 0.18);
      ctx.beginPath();
      ctx.arc(x, y, (g.r + 6) * zoom, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(g.rgb, 1);
      diamondPath(x, y, g.r * zoom, G.clock * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      diamondPath(x, y, g.r * 0.4 * zoom, G.clock * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawEnemy(e) {
    const x = sx(e.x);
    const y = sy(e.y);
    const sq = e.sq;
    const r = e.r * sq * zoom;
    const rgb = e.flash > 0.35 ? WHITE : e.rgb;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(e.face * 0.15);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.55, r * 0.9, r * 0.35, 0, 0, TAU);
    ctx.fill();
    if (e.type === 'boss') {
      ctx.rotate(G.t * 0.7);
      ctx.fillStyle = rgba(GOLD, 0.85);
      for (let i = 0; i < 8; i++) {
        const a = (TAU * i) / 8;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7);
        ctx.lineTo(Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25);
        ctx.lineTo(Math.cos(a + 0.12) * r * 0.7, Math.sin(a + 0.12) * r * 0.7);
        ctx.fill();
      }
      ctx.rotate(-G.t * 0.7);
    }
    ctx.fillStyle = rgba(rgb, e.dying ? clamp(e.dying * 10, 0, 1) : 1);
    ctx.beginPath();
    if (e.type === 'runner') ctx.ellipse(0, 0, r * 1.15, r * 0.75, e.face, 0, TAU);
    else ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(mixDark(rgb), 0.55);
    ctx.beginPath();
    ctx.arc(-r * 0.18, -r * 0.12, r * 0.62, 0, TAU);
    ctx.fill();
    const eye = Math.max(1.4, r * 0.18);
    const ex = Math.cos(e.face) * r * 0.28;
    const ey = Math.sin(e.face) * r * 0.28;
    ctx.fillStyle = '#140814';
    ctx.beginPath();
    ctx.arc(ex - eye * 0.7, ey - eye * 0.2, eye, 0, TAU);
    ctx.arc(ex + eye * 0.7, ey + eye * 0.2, eye, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.9);
    ctx.beginPath();
    ctx.arc(ex - eye * 0.7 + 0.6, ey - eye * 0.2, eye * 0.35, 0, TAU);
    ctx.arc(ex + eye * 0.7 + 0.6, ey + eye * 0.2, eye * 0.35, 0, TAU);
    ctx.fill();
    if (e.type === 'elite') {
      ctx.strokeStyle = rgba(CYN, 0.7);
      ctx.lineWidth = 2 * zoom;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.18, 0, TAU);
      ctx.stroke();
    }
    if (e.hp < e.max && e.type !== 'swarm') {
      const bw = r * 1.6;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(-bw * 0.5, -r - 7 * zoom, bw, 3 * zoom);
      ctx.fillStyle = rgba(e.type === 'boss' ? GOLD : MAG, 0.95);
      ctx.fillRect(-bw * 0.5, -r - 7 * zoom, bw * clamp(e.hp / e.max, 0, 1), 3 * zoom);
    }
    ctx.restore();
  }

  function mixDark(rgb) {
    return [(rgb[0] * 0.45) | 0, (rgb[1] * 0.3) | 0, (rgb[2] * 0.45) | 0];
  }

  function drawPlayer() {
    if (G.mode === 'dying' && G.endT < 0.5) return;
    const x = sx(P.x);
    const y = sy(P.y);
    const flick = G.iFrame > 0 && ((G.t * 18) | 0) % 2 === 0;
    for (let i = 0; i < trail.length; i++) {
      const t = trail[i];
      const a = (i + 1) / trail.length * 0.28;
      ctx.fillStyle = rgba(CYN, a);
      diamondPath(sx(t.x), sy(t.y), PLAYER_R * 0.7 * zoom, t.a);
      ctx.fill();
    }
    ctx.save();
    if (flick) ctx.globalAlpha = 0.45;
    ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(x, y, (PLAYER_R + 10) * zoom, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 1);
    diamondPath(x, y, PLAYER_R * zoom, P.face + Math.PI / 2);
    ctx.fill();
    ctx.fillStyle = rgba(WHITE, 0.92);
    diamondPath(x, y, PLAYER_R * 0.42 * zoom, P.face + Math.PI / 2);
    ctx.fill();
    if (G.muzzle > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHITE, G.muzzle * 0.8);
      const mx = x + Math.cos(P.face) * 16 * zoom;
      const my = y + Math.sin(P.face) * 16 * zoom;
      ctx.beginPath();
      ctx.arc(mx, my, 7 * zoom * G.muzzle, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    const st = stats();
    const hp = clamp(G.hp / st.maxHp, 0, 1);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2.2 * zoom;
    ctx.beginPath();
    ctx.arc(x, y, (PLAYER_R + 7) * zoom, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = rgba(hp < 0.32 ? HOT : MAG, 0.95);
    ctx.beginPath();
    ctx.arc(x, y, (PLAYER_R + 7) * zoom, -Math.PI / 2, -Math.PI / 2 + TAU * hp);
    ctx.stroke();
  }

  function drawOrbs() {
    for (let i = 0; i < orbs.length; i++) {
      const o = orbs[i];
      const x = sx(o.x);
      const y = sy(o.y);
      ctx.fillStyle = rgba(i % 2 ? MAG : CYN, 0.25);
      ctx.beginPath();
      ctx.arc(x, y, 10 * zoom, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(i % 2 ? MAG : CYN, 1);
      diamondPath(x, y, 7 * zoom, o.a);
      ctx.fill();
      ctx.fillStyle = '#fff';
      diamondPath(x, y, 3 * zoom, o.a);
      ctx.fill();
    }
  }

  function drawBullets() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < bullets.live.length; i++) {
      const b = bullets.live[i];
      const x = sx(b.x);
      const y = sy(b.y);
      const ang = Math.atan2(b.vy, b.vx);
      const rgb = b.kind === 'spread' ? MAG : CYN;
      ctx.fillStyle = rgba(rgb, 0.25);
      ctx.beginPath();
      ctx.arc(x, y, 8 * zoom, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(rgb, 1);
      diamondPath(x, y, b.r * zoom, ang + Math.PI / 2);
      ctx.fill();
      ctx.strokeStyle = rgba(WHITE, 0.5);
      ctx.lineWidth = 1.4 * zoom;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - Math.cos(ang) * 12 * zoom, y - Math.sin(ang) * 12 * zoom);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBolts() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < bolts.live.length; i++) {
      const b = bolts.live[i];
      const a = clamp(b.life / 0.14, 0, 1);
      ctx.strokeStyle = rgba(b.rgb, 0.35 * a);
      ctx.lineWidth = 7 * zoom;
      ctx.beginPath();
      for (let k = 0; k < b.pts.length; k++) {
        const p = b.pts[k];
        if (k === 0) ctx.moveTo(sx(p.x), sy(p.y));
        else ctx.lineTo(sx(p.x), sy(p.y));
      }
      ctx.stroke();
      ctx.strokeStyle = rgba(WHITE, 0.9 * a);
      ctx.lineWidth = 2 * zoom;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawRings() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < rings.live.length; i++) {
      const r = rings.live[i];
      const a = clamp(r.life / r.max, 0, 1);
      ctx.strokeStyle = rgba(r.rgb, 0.75 * a);
      ctx.lineWidth = r.w * zoom * (0.5 + a);
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), r.r * zoom, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawParts() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < parts.live.length; i++) {
      const p = parts.live[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * zoom * (0.4 + a), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFloats() {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.live.length; i++) {
      const f = floats.live[i];
      const a = clamp(f.life / 0.3, 0, 1);
      ctx.globalAlpha = a;
      ctx.font = (f.crit ? '900 ' : '700 ') + (f.crit ? 18 : 14) * zoom + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.shadowColor = rgba(f.rgb, 0.7);
      ctx.shadowBlur = 8;
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
    ctx.restore();
  }

  function drawBossBar() {
    if (!G.bossAlive || G.bossMax <= 0) return;
    const w = Math.min(420, W * 0.62);
    const x = (W - w) * 0.5;
    const y = 14;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, w, 8);
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.fillRect(x, y, w * clamp(G.bossHp / G.bossMax, 0, 1), 8);
    ctx.strokeStyle = rgba(GOLD, 0.7);
    ctx.strokeRect(x - 0.5, y - 0.5, w + 1, 9);
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.font = '700 11px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('潮主', W * 0.5, y - 4);
  }

  function drawVignette() {
    const g = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.22, W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(5,3,12,0.55)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    if (G.hurt > 0 || (G.hp / G.maxHp < 0.32 && G.mode === 'play' && !G.demo)) {
      const a = Math.max(G.hurt * 0.5, G.mode === 'play' ? 0.12 + 0.1 * Math.sin(G.t * 8) : 0);
      const r = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.3, W * 0.5, H * 0.5, Math.max(W, H) * 0.7);
      r.addColorStop(0, 'rgba(0,0,0,0)');
      r.addColorStop(1, 'rgba(180, 12, 48,' + a + ')');
      ctx.fillStyle = r;
      ctx.fillRect(0, 0, W, H);
    }
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
      ctx.fillRect(0, 0, W, H);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.translate(W * 0.5, H * 0.5);
    ctx.scale(G.punch, G.punch);
    ctx.translate(-W * 0.5, -H * 0.5);
    drawFloor();
    drawGems();
    const list = enemies.live.slice();
    list.sort(function (a, b) { return a.y - b.y; });
    for (let i = 0; i < list.length; i++) drawEnemy(list[i]);
    drawOrbs();
    drawPlayer();
    drawBullets();
    drawBolts();
    drawRings();
    drawParts();
    drawFloats();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawVignette();
    drawBossBar();
  }

  function eventToLocal(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function localToWorld(lx, ly) {
    return { x: camX + lx / zoom, y: camY + ly / zoom };
  }

  function onPointerDown(e) {
    audio.ensure();
    if (e.target.closest && e.target.closest('button, .card-up, .modes, .tools')) return;
    if (G.mode === 'pick') return;
    if ((G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') && e.target === canvas) {
      start();
    }
    if (autoOn) return;
    if (G.mode !== 'play' && !G.demo) return;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    const loc = eventToLocal(e);
    if (e.pointerType === 'touch' || window.matchMedia('(pointer: coarse)').matches) {
      vpad.active = true;
      vpad.id = e.pointerId;
      vpad.ox = loc.x;
      vpad.oy = loc.y;
      vpad.x = 0;
      vpad.y = 0;
      vpadEl.classList.add('on');
      vpadEl.style.left = (loc.x - vpadEl.offsetWidth * 0.5) + 'px';
      vpadEl.style.top = (loc.y - vpadEl.offsetHeight * 0.5) + 'px';
      vpadEl.style.bottom = 'auto';
      knobEl.style.transform = 'translate(0,0)';
    } else {
      mouse.down = true;
      mouse.id = e.pointerId;
      const w = localToWorld(loc.x, loc.y);
      mouse.wx = w.x;
      mouse.wy = w.y;
    }
  }

  function onPointerMove(e) {
    const loc = eventToLocal(e);
    if (vpad.active && e.pointerId === vpad.id) {
      let dx = loc.x - vpad.ox;
      let dy = loc.y - vpad.oy;
      const max = 46;
      const len = hypot(dx, dy);
      if (len > max) { dx *= max / len; dy *= max / len; }
      vpad.x = dx / max;
      vpad.y = dy / max;
      knobEl.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    } else if (mouse.down && e.pointerId === mouse.id) {
      const w = localToWorld(loc.x, loc.y);
      mouse.wx = w.x;
      mouse.wy = w.y;
    }
  }

  function onPointerUp(e) {
    if (vpad.active && e.pointerId === vpad.id) {
      vpad.active = false;
      vpad.x = 0;
      vpad.y = 0;
      knobEl.style.transform = 'translate(0,0)';
      vpadEl.classList.remove('on');
      vpadEl.style.left = '';
      vpadEl.style.top = '';
      vpadEl.style.bottom = '';
    }
    if (mouse.down && e.pointerId === mouse.id) mouse.down = false;
  }

  function keyOf(e) {
    const k = e.key;
    if (k === 'ArrowLeft') return 'l';
    if (k === 'd' || k === 'D' || k === 'ArrowRight') return 'r';
    if (k === 'w' || k === 'W' || k === 'ArrowUp') return 'u';
    if (k === 's' || k === 'S' || k === 'ArrowDown') return 'd';
    return '';
  }

  function onKeyDown(e) {
    audio.ensure();
    if (e.key === 'a' || e.key === 'A') {
      if (!e.repeat) toggleAuto();
      e.preventDefault();
      return;
    }
    if (e.key === 'm' || e.key === 'M') {
      audio.setMuted(!audio.muted);
      e.preventDefault();
      return;
    }
    if (e.key === 'r' || e.key === 'R') {
      retry();
      e.preventDefault();
      return;
    }
    const bit = keyOf(e);
    if (bit) {
      if (!autoOn) keys[bit] = true;
      e.preventDefault();
    }
    if (autoOn) {
      if (e.key === '1' || e.key === '2' || e.key === '3' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
      }
      return;
    }
    if (G.mode === 'pick' && (e.key === '1' || e.key === '2' || e.key === '3')) {
      choosePick((e.key | 0) - 1);
      e.preventDefault();
      return;
    }
    if ((e.key === 'Enter' || e.key === ' ') && (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose')) {
      start();
      e.preventDefault();
    }
  }

  function onKeyUp(e) {
    const bit = keyOf(e);
    if (bit) {
      keys[bit] = false;
      e.preventDefault();
    }
  }

  function resize() {
    const rect = stageEl.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    zoom = Math.min(W, H) / VIEW;
    updateCam();
  }

  function autoScale() {
    if (!autoOn) return 1;
    if (G.mode === 'play' || G.mode === 'winning' || G.mode === 'dying') {
      return AUTO_SCALE[autoSpeed] || 1;
    }
    return 1;
  }

  function frame(now) {
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.08) dt = 0.08;
    if (hidden) {
      requestAnimationFrame(frame);
      return;
    }
    const turbo = autoOn && autoSpeed >= 3 && (G.mode === 'play' || G.mode === 'pick');
    if (G.stop > 0 && !REDUCE && !turbo) {
      G.stop -= dt;
      updateFx(dt * 0.55);
      G.shake = Math.max(0, G.shake - 18 * dt);
      draw();
      requestAnimationFrame(frame);
      return;
    }
    if (turbo) G.stop = 0;
    const scale = autoScale();
    acc += dt * scale;
    let steps = 0;
    const maxSteps = scale >= 8 ? 48 : scale >= 4 ? 24 : 12;
    while (acc >= STEP && steps < maxSteps) {
      update(STEP);
      acc -= STEP;
      steps += 1;
    }
    if (acc >= STEP) acc = 0;
    draw();
    requestAnimationFrame(frame);
  }

  function syncAutoUi() {
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.textContent = autoOn ? '停下' : '自动';
    btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
  }

  function syncSpeedUi() {
    speedEl.value = String(autoSpeed);
    speedLab.textContent = SPEED_LABELS[autoSpeed];
    speedEl.title = SPEED_LABELS[autoSpeed];
    speedEl.setAttribute('aria-valuetext', SPEED_LABELS[autoSpeed]);
  }

  function clearPlayerMotion() {
    keys.l = false;
    keys.r = false;
    keys.u = false;
    keys.d = false;
    mouse.down = false;
    vpad.active = false;
    vpad.x = 0;
    vpad.y = 0;
    knobEl.style.transform = 'translate(0,0)';
    vpadEl.classList.remove('on');
    vpadEl.style.left = '';
    vpadEl.style.top = '';
    vpadEl.style.bottom = '';
  }

  function toggleAuto() {
    autoOn = !autoOn;
    autoPickT = 0;
    autoOvWait = 0;
    syncAutoUi();
    if (autoOn) {
      clearPlayerMotion();
      audio.ensure();
      if (G.mode === 'play') {
        hintEl.textContent = '自动托管 · 绕潮吃光点 · A 停下 · R 重开';
      } else if (G.mode === 'title') {
        hintEl.textContent = '自动托管 · A 停下 · 八分钟或死';
      }
    } else if (G.mode === 'play') {
      hintEl.textContent = 'WASD 闪 · 自动咬 · 1 2 3 升级 · A 自动 · R 重开';
    } else if (G.mode === 'title') {
      hintEl.textContent = '闪着打 · 吃光点升级 · A 自动 · 八分钟或死';
    }
  }

  function setAutoSpeed(n) {
    n = parseInt(n, 10);
    if (!(n >= 1 && n <= 4)) n = 3;
    autoSpeed = n;
    saveAutoSpeed(autoSpeed);
    syncSpeedUi();
  }

  ovBtn.addEventListener('click', function () { audio.ensure(); start(); });
  btnRetry.addEventListener('click', function () { retry(); });
  btnMute.addEventListener('click', function () { audio.ensure(); audio.setMuted(!audio.muted); });
  btnAuto.addEventListener('click', function () { audio.ensure(); toggleAuto(); });
  speedEl.addEventListener('input', function () { setAutoSpeed(speedEl.value); });
  modeEight.addEventListener('click', function () { setKind('eight'); });
  modeEndless.addEventListener('click', function () { setKind('endless'); });
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('resize', resize);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden) last = performance.now();
  });

  loadBest();
  autoSpeed = loadAutoSpeed();
  syncSpeedUi();
  syncAutoUi();
  audio.setMuted(audio.muted);
  seedWorld();
  resetRun(true);
  G.mode = 'title';
  showTitle();
  resize();
  syncModes();
  requestAnimationFrame(frame);
})();
