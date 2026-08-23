'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const ARMOR = 4;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.38;
  const BOMB_CAP = 6;
  const WPN_MAX = 3;
  const BEST_KEY = 'playbox-darius-best';
  const MUTE_KEY = 'playbox-darius-mute';
  const AUTO_SPEED_KEY = 'playbox-darius-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_SCALE = [1, 0.48, 0.72, 1, 2.55];
  const OPS = '方向 / WSD 移动 · 空格开火 · Shift / Z 爆弹 · A 自动 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [20, 200, 192];
  const TEAL = [61, 255, 208];
  const GOLD = [255, 227, 107];
  const HOT = [255, 176, 64];
  const WHT = [246, 240, 228];
  const PNK = [255, 154, 212];
  const RED = [255, 86, 110];
  const DEEP = [20, 14, 4];
  const SEA = [12, 48, 56];

  const SCORE = {
    minnow: 50,
    puffer: 90,
    ray: 110,
    squid: 130,
    hermit: 160,
    carrier: 320,
    eel: 240,
    seg: 16,
    boss: 4200,
    clear: 2000,
    gate: 800,
    weak: 30
  };

  const ZONES = {
    A: {
      id: 'A', name: '骨礁', boss: '骨鲨', bossKind: 'shark', bossHp: 72, hue: 48,
      up: 'B', down: 'C',
      waves: [
        { t: 0.6, kind: 'school', n: 5, y: 0.38 },
        { t: 2.4, kind: 'puffer', n: 2 },
        { t: 4.1, kind: 'school', n: 6, y: 0.62 },
        { t: 5.6, kind: 'hermit', side: -1 },
        { t: 7.0, kind: 'ray', n: 2 },
        { t: 8.6, kind: 'squid', n: 1 },
        { t: 10.0, kind: 'dive', n: 4 },
        { t: 11.4, kind: 'carrier' },
        { t: 12.8, kind: 'eel', n: 8 },
        { t: 14.2, kind: 'puffer', n: 3 },
        { t: 15.6, kind: 'school', n: 7, y: 0.5 },
        { t: 17.2, kind: 'boss' }
      ]
    },
    B: {
      id: 'B', name: '珊瑚', boss: '双剪', bossKind: 'claw', bossHp: 90, hue: 18,
      up: 'D', down: 'E',
      waves: [
        { t: 0.5, kind: 'ray', n: 3 },
        { t: 2.0, kind: 'school', n: 6, y: 0.3 },
        { t: 3.4, kind: 'hermit', side: 1 },
        { t: 4.8, kind: 'puffer', n: 3 },
        { t: 6.2, kind: 'school', n: 6, y: 0.7 },
        { t: 7.6, kind: 'squid', n: 2 },
        { t: 9.0, kind: 'carrier' },
        { t: 10.4, kind: 'eel', n: 9 },
        { t: 11.8, kind: 'dive', n: 5 },
        { t: 13.2, kind: 'hermit', side: -1 },
        { t: 14.6, kind: 'ray', n: 3 },
        { t: 16.4, kind: 'boss' }
      ]
    },
    C: {
      id: 'C', name: '海沟', boss: '电鳐', bossKind: 'ray', bossHp: 88, hue: 188,
      up: 'E', down: 'F',
      waves: [
        { t: 0.5, kind: 'eel', n: 8 },
        { t: 2.0, kind: 'squid', n: 2 },
        { t: 3.6, kind: 'school', n: 5, y: 0.45 },
        { t: 5.0, kind: 'dive', n: 4 },
        { t: 6.4, kind: 'puffer', n: 2 },
        { t: 7.8, kind: 'eel', n: 10 },
        { t: 9.2, kind: 'carrier' },
        { t: 10.6, kind: 'ray', n: 2 },
        { t: 12.0, kind: 'squid', n: 2 },
        { t: 13.4, kind: 'hermit', side: 1 },
        { t: 14.8, kind: 'school', n: 8, y: 0.55 },
        { t: 16.6, kind: 'boss' }
      ]
    },
    D: {
      id: 'D', name: '钢湾', boss: '刺鲸', bossKind: 'whale', bossHp: 124, hue: 42,
      up: null, down: null,
      waves: [
        { t: 0.4, kind: 'school', n: 7, y: 0.32 },
        { t: 1.6, kind: 'school', n: 7, y: 0.68 },
        { t: 3.0, kind: 'hermit', side: -1 },
        { t: 3.4, kind: 'hermit', side: 1 },
        { t: 5.0, kind: 'carrier' },
        { t: 6.4, kind: 'puffer', n: 4 },
        { t: 7.8, kind: 'ray', n: 3 },
        { t: 9.2, kind: 'eel', n: 10 },
        { t: 10.6, kind: 'dive', n: 6 },
        { t: 12.0, kind: 'squid', n: 2 },
        { t: 13.4, kind: 'school', n: 8, y: 0.5 },
        { t: 15.8, kind: 'boss' }
      ]
    },
    E: {
      id: 'E', name: '赤潮', boss: '铁海马', bossKind: 'horse', bossHp: 112, hue: 352,
      up: null, down: null,
      waves: [
        { t: 0.4, kind: 'puffer', n: 3 },
        { t: 1.8, kind: 'dive', n: 5 },
        { t: 3.2, kind: 'ray', n: 3 },
        { t: 4.6, kind: 'carrier' },
        { t: 6.0, kind: 'school', n: 8, y: 0.4 },
        { t: 7.4, kind: 'eel', n: 9 },
        { t: 8.8, kind: 'squid', n: 2 },
        { t: 10.2, kind: 'hermit', side: -1 },
        { t: 11.6, kind: 'puffer', n: 4 },
        { t: 13.0, kind: 'dive', n: 5 },
        { t: 14.4, kind: 'ray', n: 3 },
        { t: 16.2, kind: 'boss' }
      ]
    },
    F: {
      id: 'F', name: '巨口', boss: '巨口', bossKind: 'maw', bossHp: 140, hue: 28,
      up: null, down: null,
      waves: [
        { t: 0.4, kind: 'eel', n: 9 },
        { t: 1.8, kind: 'squid', n: 2 },
        { t: 3.2, kind: 'puffer', n: 3 },
        { t: 4.6, kind: 'school', n: 7, y: 0.5 },
        { t: 6.0, kind: 'carrier' },
        { t: 7.4, kind: 'ray', n: 3 },
        { t: 8.8, kind: 'dive', n: 6 },
        { t: 10.2, kind: 'eel', n: 11 },
        { t: 11.6, kind: 'hermit', side: 1 },
        { t: 13.0, kind: 'squid', n: 3 },
        { t: 14.4, kind: 'puffer', n: 4 },
        { t: 16.0, kind: 'boss' }
      ]
    }
  };

  const MAP_POS = {
    A: [0.50, 0.16],
    B: [0.28, 0.46],
    C: [0.72, 0.46],
    D: [0.16, 0.78],
    E: [0.50, 0.78],
    F: [0.84, 0.78]
  };

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
  const btnRed = document.getElementById('btn-red');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnBomb = document.getElementById('btn-bomb');
  const btnPad = document.getElementById('btn-pad');
  const btnAuto = document.getElementById('btn-auto');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const wpnLabel = document.getElementById('wpn-label');
  const bombLabel = document.getElementById('bomb-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const hpWrap = document.getElementById('hp-wrap');
  const hpBar = document.getElementById('hp-bar');

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
  let comboTok = 0;
  let wpnTok = 0;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: 90, y: VH * 0.5, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const bubbles = [];
  const motes = [];
  const schools = [];

  const G = {
    mode: 'title',
    kind: 'raid',
    t: 0,
    zone: 'A',
    path: ['A'],
    zoneT: 0,
    waveI: 0,
    scroll: 0,
    px: 90,
    py: VH * 0.5,
    lives: LIVES,
    armor: ARMOR,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    wpnLv: 0,
    bombs: 3,
    bombT: 0,
    bombFlash: 0,
    ents: [],
    shots: [],
    eShots: [],
    pows: [],
    gates: [],
    fireCd: 0,
    fireHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: GOLD,
    punch: 1,
    muzzle: 0,
    fork: false,
    forkT: 0,
    winT: 0,
    nextLife: LIFE_EVERY,
    dropI: 0,
    why: '',
    bossIn: false
  };

  let inputSrc = 'key';
  let autoOn = false;
  let autoSpeed = 3;
  let autoTx = 90;
  let autoTy = VH * 0.5;
  let autoStickS = -1e9;
  let autoOvWait = 0;
  let autoGate = null;

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function isRed() {
    return G.kind === 'red';
  }
  function zoneOf(id) {
    return ZONES[id] || ZONES.A;
  }
  function comboMul(c) {
    return 1 + Math.min(4, Math.floor(Math.max(0, c - 1) / 3));
  }
  function plySpd() {
    return isRed() ? 322 : 278;
  }
  function scrollSpd() {
    if (G.fork) return 18;
    if (G.bossIn) return isRed() ? 30 : 22;
    const base = isRed() ? 128 : 90;
    const rush = G.combo >= 8 ? 14 : G.combo >= 4 ? 7 : 0;
    return base + rush;
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function hueRgb(h, s, l) {
    s = s == null ? 0.72 : s;
    l = l == null ? 0.52 : l;
    const a = ((h % 360) + 360) % 360 / 60;
    const i = Math.floor(a);
    const f = a - i;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(f - 1));
    const m = l - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;
    if (i === 0) { r = c; g = x; }
    else if (i === 1) { r = x; g = c; }
    else if (i === 2) { g = c; b = x; }
    else if (i === 3) { g = x; b = c; }
    else if (i === 4) { r = x; b = c; }
    else { r = c; b = x; }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }
  function moveVec(l, r, u, d) {
    let dx = (r ? 1 : 0) - (l ? 1 : 0);
    let dy = (d ? 1 : 0) - (u ? 1 : 0);
    const m = Math.sqrt(dx * dx + dy * dy);
    if (m > 1) {
      dx /= m;
      dy /= m;
    }
    return { x: dx, y: dy };
  }
  function pathText() {
    return G.path && G.path.length ? G.path.join('→') : 'A';
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    ensure() {
      if (!this.ctx) {
        const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.3;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.3;
      if (btnMute) {
        btnMute.textContent = m ? '静' : '声';
        btnMute.classList.toggle('muted', m);
        btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      }
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (err) { /* ignore */ }
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
    shoot() {
      this.ensure();
      this.beep(720 + G.wpnLv * 40, 0.046, 'square', 0.03, 1640);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.034, 0.032, 1400);
      this.beep(560 * lift, 0.064, 'square', 0.042, 980 * lift);
    },
    weak() {
      this.ensure();
      this.beep(880, 0.07, 'triangle', 0.046, 1320);
      this.beep(1320, 0.1, 'sine', 0.03, 1760);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.2 : 0.09, big ? 0.076 : 0.046, big ? 220 : 460);
      this.beep(big ? 150 : 250, big ? 0.26 : 0.13, 'sawtooth', 0.052, 50);
    },
    bomb() {
      this.ensure();
      this.noise(0.3, 0.082, 160);
      this.beep(86, 0.44, 'sawtooth', 0.07, 38);
      this.beep(760, 0.2, 'sine', 0.04, 210);
    },
    pow() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1046);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    armor() {
      this.ensure();
      this.beep(392, 0.07, 'triangle', 0.04, 523);
      this.beep(659, 0.12, 'sine', 0.038, 880);
    },
    gate() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.042, 523);
      this.beep(523, 0.11, 'sine', 0.042, 659);
      this.beep(784, 0.2, 'triangle', 0.046, 1046);
    },
    death() {
      this.ensure();
      this.noise(0.16, 0.058, 320);
      this.beep(280, 0.2, 'sawtooth', 0.05, 70);
      this.beep(150, 0.32, 'sine', 0.045, 42);
    },
    boss() {
      this.ensure();
      this.beep(180, 0.18, 'sawtooth', 0.052, 96);
      this.beep(130, 0.3, 'square', 0.04, 70);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.045, 784);
      this.beep(1046, 0.22, 'sine', 0.05, 1318);
    },
    lose() {
      this.ensure();
      this.beep(210, 0.18, 'sawtooth', 0.04, 86);
      this.beep(130, 0.32, 'sine', 0.05, 44);
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
    hurt() {
      this.ensure();
      this.noise(0.07, 0.04, 700);
      this.beep(240, 0.12, 'sawtooth', 0.04, 90);
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
    try {
      localStorage.setItem(BEST_KEY, String(G.best));
    } catch (err) { /* ignore */ }
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
    try {
      localStorage.setItem(AUTO_SPEED_KEY, String(n));
    } catch (err) { /* ignore */ }
  }

  function addScore(n) {
    if (G.mode !== 'play' || n <= 0) return;
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

  function wpnText() {
    if (G.wpnLv >= WPN_MAX) return '鳞 MAX';
    if (G.wpnLv <= 0) return '鳞';
    return '鳞 ' + ['', 'Ⅱ', 'Ⅲ', 'Ⅳ'][G.wpnLv];
  }

  function flashWpn() {
    if (!wpnLabel) return;
    wpnLabel.classList.remove('hot');
    void wpnLabel.offsetWidth;
    wpnLabel.classList.add('hot');
    wpnTok += 1;
    const tok = wpnTok;
    setTimeout(function () {
      if (tok === wpnTok && wpnLabel) wpnLabel.classList.remove('hot');
    }, 280);
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

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const z = zoneOf(G.zone);
    if (stageLabel) {
      stageLabel.textContent = G.bossIn ? z.boss : ('区 ' + pathText());
      stageLabel.classList.toggle('hot', G.bossIn || G.path.length >= 3);
    }
    if (tagLabel) {
      tagLabel.textContent = isRed() ? '红海' : '远征';
      tagLabel.classList.toggle('warn', isRed());
      tagLabel.classList.toggle('hot', !isRed() && G.path.length >= 3);
    }
    if (wpnLabel) wpnLabel.textContent = wpnText();
    if (bombLabel) {
      bombLabel.textContent = '爆 ×' + G.bombs;
      bombLabel.classList.toggle('empty', G.bombs <= 0);
    }
    const noBomb = G.mode === 'play' && G.bombs <= 0 && G.bombT <= 0;
    if (btnBomb) btnBomb.disabled = noBomb;
    if (btnPad) btnPad.disabled = noBomb;
    if (hpBar) hpBar.style.transform = 'scaleX(' + clamp(G.armor / ARMOR, 0, 1) + ')';
    if (hpWrap) hpWrap.classList.toggle('warn', G.armor <= 1 && G.mode === 'play');
    if (comboEl) {
      if (G.combo >= 2 && G.mode === 'play') {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? G.combo + ' 连 ×' + G.mult : G.combo + ' 连';
      } else {
        comboEl.hidden = true;
      }
    }
    if (autoOn && (G.mode === 'play' || G.mode === 'title')) setHint('托管中 · A 停下', 'hot');
    else if (autoOn && (G.mode === 'lose' || G.mode === 'win')) setHint('托管中 · R 重开接着打', 'hot');
    else if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 甲空或撞击扣一命', 'warn');
    else if (G.mode === 'win') setHint('海路尽破 · R 再来一局', 'hot');
    else if (G.fork) setHint('飞进上航 / 下潜门选下一区', 'hot');
    else if (G.lives === 1 || G.armor <= 1) setHint('甲将尽 · 打发光弱点 · Shift 爆弹', 'warn');
    else setHint('方向移动 · 空格开火 · Shift 爆弹 · 打鱼舰弱点', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'DARS';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (btnOvRetry) btnOvRetry.textContent = '再来';
    if (btnOvModes) {
      if (kind === 'win' && !isRed()) btnOvModes.textContent = '红海';
      else btnOvModes.textContent = '换模式';
    }
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function hitStop(sec) {
    if (REDUCE || G.mode !== 'play') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag) {
    if (REDUCE || G.mode !== 'play') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.006));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 6.5 ? 'die' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die');
        stageEl.classList.remove('hit');
      }
    }, 360);
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.4);
    G.flashRgb = rgb;
  }

  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }

  function emit(n, spec) {
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
    capArr(particles, 380);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 48);
    capArr(rings, 32);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: gold ? 0.92 : 0.64,
      size: gold ? 20 : 14, gold: !!gold, vy: gold ? -88 : -72
    });
    capArr(floats, 28);
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const m = comboMul(G.combo);
    if (m > G.mult) {
      audio.combo(m);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
        comboTok += 1;
        const tok = comboTok;
        setTimeout(function () {
          if (tok === comboTok && comboEl) comboEl.classList.remove('hot');
        }, 280);
      }
    }
    G.mult = m;
  }

  function seedDecor() {
    bubbles.length = 0;
    motes.length = 0;
    schools.length = 0;
    for (let i = 0; i < 28; i++) {
      bubbles.push({
        x: rand(0, VW),
        y: rand(0, VH),
        r: rand(1.4, 4.2),
        v: rand(18, 46),
        w: rand(8, 22)
      });
    }
    for (let i = 0; i < 42; i++) {
      motes.push({
        x: rand(0, VW),
        y: rand(0, VH),
        s: rand(0.8, 2.2),
        v: rand(12, 40),
        a: rand(0.12, 0.4)
      });
    }
    for (let i = 0; i < 10; i++) {
      schools.push({
        x: rand(0, VW),
        y: rand(40, VH - 40),
        n: 4 + (hash2(i + 3) * 5) | 0,
        s: rand(0.6, 1.2),
        v: rand(16, 34)
      });
    }
  }

  function clearField() {
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.pows.length = 0;
    G.gates.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function makeShot(x, y, vx, vy, dmg) {
    return { x: x, y: y, vx: vx, vy: vy || 0, r: 3.4, life: 0.9, dmg: dmg || 1, dead: false };
  }

  function makeEShot(x, y, vx, vy, r, rgb) {
    return { x: x, y: y, vx: vx, vy: vy, r: r || 3.6, life: 2.6, rgb: rgb || HOT, dead: false };
  }

  function aimShot(x, y, tx, ty, spd, r, rgb) {
    const d = hypot(tx - x, ty - y) || 1;
    return makeEShot(x, y, (tx - x) / d * spd, (ty - y) / d * spd, r, rgb);
  }

  function makeMinnow(x, y, amp) {
    return {
      type: 'minnow', x: x, y: y, baseY: y, w: 18, h: 10, hp: 1, score: SCORE.minnow,
      vx: isRed() ? -150 : -118, amp: amp || 16, bob: rand(0, TAU), dead: false, hitT: 0
    };
  }

  function makePuffer(x, y) {
    return {
      type: 'puffer', x: x, y: y, w: 22, h: 22, hp: 3, score: SCORE.puffer,
      vx: isRed() ? -72 : -56, inflate: 0, cd: rand(0.6, 1.4), dead: false, hitT: 0
    };
  }

  function makeRay(x, y) {
    return {
      type: 'ray', x: x, y: y, baseY: y, w: 28, h: 16, hp: 2, score: SCORE.ray,
      vx: isRed() ? -96 : -78, bob: rand(0, TAU), amp: 28, cd: rand(0.5, 1.2), dead: false, hitT: 0
    };
  }

  function makeSquid(x, y) {
    return {
      type: 'squid', x: x, y: y, w: 20, h: 26, hp: 3, score: SCORE.squid,
      vx: isRed() ? -64 : -48, pulse: rand(0, TAU), cd: rand(0.7, 1.4), dead: false, hitT: 0
    };
  }

  function makeHermit(x, side) {
    const top = side < 0;
    return {
      type: 'hermit', x: x, y: top ? 28 : VH - 28, w: 22, h: 18, hp: 3, score: SCORE.hermit,
      top: top, vx: isRed() ? -42 : -32, cd: rand(0.4, 1.1), flash: 0, dead: false, hitT: 0
    };
  }

  function makeCarrier(x, y) {
    return {
      type: 'carrier', x: x, y: y, baseY: y, w: 34, h: 18, hp: 5, score: SCORE.carrier,
      vx: isRed() ? -70 : -54, bob: 0, drop: true, dead: false, hitT: 0
    };
  }

  function makeEel(x, y, n) {
    const segs = [];
    for (let i = 0; i < n; i++) segs.push({ x: x + i * 12, y: y });
    return {
      type: 'eel', x: x, y: y, baseY: y, w: 16, h: 12, hp: n - 2, score: SCORE.eel,
      segs: segs, vx: isRed() ? -88 : -70, bob: rand(0, TAU), dead: false, hitT: 0
    };
  }

  function makeDive(x, y) {
    return {
      type: 'dive', x: x, y: y, w: 16, h: 12, hp: 1, score: SCORE.minnow + 20,
      vx: isRed() ? -80 : -60, vy: 0, dash: 0.55 + rand(0, 0.5), dead: false, hitT: 0
    };
  }

  function makeBoss(kind, name, hp) {
    const mul = isRed() ? 1.24 : 1;
    const h = Math.round(hp * mul);
    return {
      type: 'boss', kind: kind, name: name,
      x: VW + 90, y: VH * 0.5, vx: -48, vy: 0,
      hp: h, maxhp: h, score: SCORE.boss,
      t: 0, cd: 0.8, flash: 0, phase: 1,
      park: kind === 'whale' ? VW - 118 : VW - 142,
      lunge: 0, ret: false, open: 0, lure: 1,
      ang: 0, dead: false, hitT: 0, weakFlash: 0
    };
  }

  function spawnSchool(n, yf) {
    const y = VH * (yf == null ? 0.5 : yf);
    for (let i = 0; i < n; i++) {
      G.ents.push(makeMinnow(VW + 24 + i * 22, y + (i % 2 ? 18 : -18), 14 + i * 2));
    }
  }

  function nextDrop() {
    const cycle = ['shot', 'armor', 'bomb', 'shot'];
    const k = cycle[G.dropI % cycle.length];
    G.dropI += 1;
    return k;
  }

  function spawnPow(x, y, kind) {
    G.pows.push({
      kind: kind || nextDrop(), x: x, y: y, vx: -40, vy: rand(-20, 20),
      bob: 0, dead: false, r: 11
    });
  }

  function spawnWave(w) {
    const extra = isRed() ? 1 : 0;
    if (w.kind === 'school') spawnSchool(w.n + extra, w.y);
    else if (w.kind === 'puffer') {
      for (let i = 0; i < w.n + extra; i++) {
        G.ents.push(makePuffer(VW + 30 + i * 36, 70 + (i * 95) % (VH - 140)));
      }
    } else if (w.kind === 'ray') {
      for (let i = 0; i < w.n + extra; i++) {
        G.ents.push(makeRay(VW + 28 + i * 40, 80 + i * 70));
      }
    } else if (w.kind === 'squid') {
      for (let i = 0; i < w.n + extra; i++) {
        G.ents.push(makeSquid(VW + 36 + i * 44, 90 + i * 80));
      }
    } else if (w.kind === 'hermit') {
      G.ents.push(makeHermit(VW + 20, w.side || -1));
      if (isRed()) G.ents.push(makeHermit(VW + 80, -(w.side || -1)));
    } else if (w.kind === 'carrier') {
      G.ents.push(makeCarrier(VW + 40, VH * (w.y || 0.42)));
    } else if (w.kind === 'eel') {
      G.ents.push(makeEel(VW + 30, VH * 0.5, (w.n || 8) + extra));
    } else if (w.kind === 'dive') {
      for (let i = 0; i < w.n + extra; i++) {
        G.ents.push(makeDive(VW + 20 + i * 26, 50 + hash2(i + G.zoneT) * (VH - 100)));
      }
    } else if (w.kind === 'boss') {
      const z = zoneOf(G.zone);
      G.ents.push(makeBoss(z.bossKind, z.boss, z.bossHp));
      G.bossIn = true;
      audio.boss();
      toast(z.boss + ' · 打发光点', false, true);
      kick(5);
      screenFlash(GOLD, 0.28);
    }
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.fireCd > 0) return;
    const lv = G.wpnLv;
    const cd = lv >= 3 ? 0.068 : lv === 2 ? 0.086 : lv === 1 ? 0.1 : 0.118;
    G.fireCd = isRed() ? cd * 0.92 : cd;
    G.muzzle = 0.06;
    const x = G.px + 18;
    const y = G.py;
    const spd = 640 + lv * 30;
    if (lv <= 0) {
      G.shots.push(makeShot(x, y, spd, 0, 1));
    } else if (lv === 1) {
      G.shots.push(makeShot(x, y - 6, spd, 0, 1));
      G.shots.push(makeShot(x, y + 6, spd, 0, 1));
    } else if (lv === 2) {
      G.shots.push(makeShot(x, y, spd, 0, 1));
      G.shots.push(makeShot(x, y, spd * 0.96, -150, 1));
      G.shots.push(makeShot(x, y, spd * 0.96, 150, 1));
    } else {
      G.shots.push(makeShot(x, y, spd, 0, 1));
      G.shots.push(makeShot(x, y - 5, spd, -40, 1));
      G.shots.push(makeShot(x, y + 5, spd, 40, 1));
      G.shots.push(makeShot(x, y, spd * 0.94, -210, 1));
      G.shots.push(makeShot(x, y, spd * 0.94, 210, 1));
    }
    capArr(G.shots, 80);
    audio.shoot();
    emit(3, {
      x: x, y: y, j: 3,
      vx0: 40, vx1: 120, vy0: -30, vy1: 30,
      r0: 1.2, r1: 2.6, life: 0.16, rgb: GOLD, g: 0
    });
  }

  function tryBomb() {
    audio.ensure();
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.bombs <= 0 || G.bombT > 0) {
      if (G.bombs <= 0) toast('爆弹用尽', true, false);
      return;
    }
    G.bombs -= 1;
    G.bombT = 0.42;
    G.bombFlash = 0.55;
    G.invuln = Math.max(G.invuln, 0.42);
    audio.bomb();
    hitStop(0.078);
    kick(7.2);
    screenFlash(GOLD, 0.62);
    popSpark(G.px, G.py, GOLD, 48);
    rings.push({ x: G.px, y: G.py, t: 0, rgb: TEAL, r: 80 });
    if (stageEl) {
      stageEl.classList.remove('bomb');
      void stageEl.offsetWidth;
      stageEl.classList.add('bomb');
      setTimeout(function () {
        if (stageEl) stageEl.classList.remove('bomb');
      }, 520);
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      if (s.dead) continue;
      s.dead = true;
      emit(3, {
        x: s.x, y: s.y, j: 4,
        vx0: -80, vx1: 80, vy0: -80, vy1: 80,
        r0: 1.2, r1: 2.8, life: 0.22, rgb: GOLD, g: 0
      });
    }
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      const dmg = e.type === 'boss' ? 16 : 8;
      hurtEnt(e, dmg, e.x, e.y, false);
    }
    syncHud();
  }

  function weakPoints(e) {
    const pts = [];
    if (e.type !== 'boss') return pts;
    const k = e.kind;
    if (k === 'shark') pts.push({ x: e.x - 46, y: e.y - 8, r: 14 });
    else if (k === 'claw') {
      pts.push({ x: e.x - 70, y: e.y - 36, r: 15 });
      pts.push({ x: e.x - 70, y: e.y + 36, r: 15 });
    } else if (k === 'ray') pts.push({ x: e.x, y: e.y, r: 16 });
    else if (k === 'whale') pts.push({ x: e.x - 78, y: e.y + 6, r: 18 });
    else if (k === 'horse') pts.push({ x: e.x + 2, y: e.y + 8, r: 14 });
    else if (k === 'maw') {
      if (e.phase < 2) pts.push({ x: e.x - 36, y: e.y - 56, r: 13 });
      else pts.push({ x: e.x - 54, y: e.y + 4, r: 20 });
    }
    return pts;
  }

  function bodyHit(e, x, y, r) {
    if (e.type === 'boss') {
      const k = e.kind;
      let bw = 90;
      let bh = 36;
      if (k === 'claw') { bw = 80; bh = 70; }
      else if (k === 'ray') { bw = 88; bh = 42; }
      else if (k === 'whale') { bw = 110; bh = 56; }
      else if (k === 'horse') { bw = 28; bh = 78; }
      else if (k === 'maw') { bw = 70; bh = 60; }
      const nx = clamp(x, e.x - bw, e.x + bw * 0.4);
      const ny = clamp(y, e.y - bh, e.y + bh);
      return hypot(x - nx, y - ny) <= r + 4;
    }
    if (e.type === 'eel' && e.segs) {
      for (let i = 0; i < e.segs.length; i++) {
        if (hypot(x - e.segs[i].x, y - e.segs[i].y) < r + 7) return true;
      }
      return false;
    }
    const hw = (e.w || 16) * 0.5;
    const hh = (e.h || 12) * 0.5;
    const nx = clamp(x, e.x - hw, e.x + hw);
    const ny = clamp(y, e.y - hh, e.y + hh);
    return hypot(x - nx, y - ny) <= r;
  }

  function explodeEnt(e, big) {
    const rgb = e.type === 'boss' ? GOLD : (e.type === 'carrier' ? TEAL : CYN);
    emit(big ? 28 : 12, {
      x: e.x, y: e.y, j: big ? 28 : 10,
      vx0: -160, vx1: 160, vy0: -160, vy1: 160,
      r0: 1.6, r1: big ? 6 : 3.4, life: big ? 0.55 : 0.32, rgb: rgb, g: 80
    });
    popSpark(e.x, e.y, rgb, big ? 36 : 16);
    audio.boom(big);
  }

  function killEnt(e, weak) {
    if (e.dead) return;
    e.dead = true;
    const base = e.score || 50;
    const pts = Math.round(base * G.mult * (weak ? 1.2 : 1));
    addScore(pts);
    bumpCombo();
    floatText(e.x, e.y - 10, '+' + pts, weak ? GOLD : WHT, weak || pts >= 400);
    explodeEnt(e, e.type === 'boss' || e.type === 'carrier' || e.type === 'eel');
    if (e.type === 'carrier' && e.drop) spawnPow(e.x, e.y, nextDrop());
    if (e.type === 'boss') onBossDown(e);
    hitStop(e.type === 'boss' ? 0.08 : clamp(0.032 + G.combo * 0.0024, 0.032, 0.068));
    kick(e.type === 'boss' ? 7.4 : 2.4);
  }

  function hurtEnt(e, dmg, hx, hy, weak) {
    if (e.dead) return;
    e.hp -= dmg;
    e.hitT = 0.08;
    if (weak) e.weakFlash = 0.16;
    else e.flash = 0.1;
    if (e.type === 'boss' && e.kind === 'maw' && e.phase < 2 && e.hp > 0 && e.hp <= e.maxhp * 0.55) {
      e.phase = 2;
      e.lure = 0;
      toast('巨口张开', false, true);
      audio.boss();
      screenFlash(MAG, 0.3);
    }
    if (e.hp <= 0) {
      killEnt(e, weak);
      return;
    }
    if (weak) {
      audio.weak();
      bumpCombo();
      const pts = Math.round(SCORE.weak * G.mult);
      addScore(pts);
      floatText(hx, hy - 8, '弱点', GOLD, true);
      emit(8, {
        x: hx, y: hy, j: 8,
        vx0: -120, vx1: 80, vy0: -110, vy1: 110,
        r0: 1.4, r1: 3.4, life: 0.28, rgb: GOLD, g: 40
      });
      popSpark(hx, hy, GOLD, 18);
      hitStop(0.052);
      kick(3.2);
    } else {
      audio.hit(G.combo);
      emit(4, {
        x: hx, y: hy, j: 5,
        vx0: -90, vx1: 40, vy0: -70, vy1: 70,
        r0: 1, r1: 2.4, life: 0.18, rgb: CYN, g: 0
      });
      hitStop(0.028);
    }
  }

  function onBossDown(e) {
    G.bossIn = false;
    addScore(Math.round(1500 * G.path.length * G.mult));
    addScore(SCORE.clear);
    G.bombs = Math.min(BOMB_CAP, G.bombs + 1);
    if (G.armor < ARMOR) G.armor = Math.min(ARMOR, G.armor + 1);
    screenFlash(GOLD, 0.5);
    for (let i = 0; i < G.eShots.length; i++) G.eShots[i].dead = true;
    for (let i = 0; i < G.ents.length; i++) {
      const o = G.ents[i];
      if (!o.dead && o.type !== 'boss') o.vx = -240;
    }
    const z = zoneOf(G.zone);
    toast(z.name + '肃清', false, true);
    if (z.up && z.down) {
      G.fork = true;
      G.forkT = 11;
      G.gates.push({ side: 'up', x: VW - 86, y: VH * 0.28, r: 30, next: z.up, t: 0 });
      G.gates.push({ side: 'down', x: VW - 86, y: VH * 0.72, r: 30, next: z.down, t: 0 });
      toast('选航 · 上 ' + zoneOf(z.up).name + ' / 下 ' + zoneOf(z.down).name, false, true);
    } else {
      G.winT = 1.85;
    }
    syncHud();
  }

  function enterZone(id) {
    const z = zoneOf(id);
    G.zone = id;
    if (G.path[G.path.length - 1] !== id) G.path.push(id);
    G.zoneT = 0;
    G.waveI = 0;
    G.fork = false;
    G.forkT = 0;
    G.bossIn = false;
    autoGate = null;
    G.gates.length = 0;
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.pows.length = 0;
    G.invuln = Math.max(G.invuln, 0.7);
    G.px = clamp(G.px, 40, 160);
    audio.gate();
    screenFlash(hueRgb(z.hue), 0.4);
    hitStop(0.07);
    kick(4);
    toast('转入 ' + z.id + ' · ' + z.name, false, true);
    syncHud();
  }

  function pickGate(g) {
    addScore(SCORE.gate);
    floatText(g.x, g.y, '转入 ' + g.next, GOLD, true);
    enterZone(g.next);
  }

  function hurtPlayer(dmg, why, hx, hy) {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0 || G.bombT > 0) return;
    G.armor -= dmg;
    G.why = why;
    emit(10, {
      x: G.px, y: G.py, j: 10,
      vx0: -80, vx1: 80, vy0: -80, vy1: 80,
      r0: 1.4, r1: 3.6, life: 0.28, rgb: MAG, g: 0
    });
    popSpark(G.px, G.py, MAG, 14);
    if (G.armor > 0) {
      G.invuln = 0.88;
      audio.hurt();
      hitStop(0.048);
      kick(4.2);
      screenFlash(MAG, 0.28);
      toast(G.armor <= 1 ? '甲将尽' : '甲 -' + dmg, true, false);
      syncHud();
      return;
    }
    G.armor = 0;
    diePlayer();
  }

  function diePlayer() {
    G.lives -= 1;
    G.deadT = 0.95;
    G.fireHold = false;
    audio.death();
    hitStop(0.078);
    kick(8);
    screenFlash(MAG, 0.55);
    emit(32, {
      x: G.px, y: G.py, j: 18,
      vx0: -200, vx1: 200, vy0: -200, vy1: 200,
      r0: 2, r1: 6, life: 0.5, rgb: MAG, g: 60
    });
    popSpark(G.px, G.py, MAG, 32);
    for (let i = 0; i < G.eShots.length; i++) G.eShots[i].dead = true;
    if (G.wpnLv > 0) {
      spawnPow(G.px + 24, G.py, 'shot');
      G.wpnLv = Math.max(0, G.wpnLv - 1);
    }
    syncHud();
  }

  function respawn() {
    G.deadT = 0;
    G.armor = ARMOR;
    G.invuln = 1.55;
    G.px = 90;
    G.py = VH * 0.5;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    const why = G.why === 'shot' ? '中弹甲尽' : G.why === 'crash' ? '撞击甲尽' : '甲空坠海';
    showOverlay(
      'lose',
      '银鹰坠了',
      why + ' · ' + pathText() + ' · ' + G.score + ' 分。R 重开。'
    );
    syncHud();
  }

  function goWin() {
    addScore(8000);
    G.mode = 'win';
    audio.win();
    screenFlash(GOLD, 0.5);
    showOverlay(
      'win',
      '海路尽破',
      (isRed() ? '红海' : '远征') + ' · ' + pathText() + ' · ' + zoneOf(G.zone).boss + '击破 · ' + G.score + ' 分'
    );
    syncHud();
  }

  function collectPow(p) {
    p.dead = true;
    audio.pow();
    popSpark(p.x, p.y, GOLD, 16);
    screenFlash(GOLD, 0.18);
    hitStop(0.04);
    if (p.kind === 'shot') {
      if (G.wpnLv >= WPN_MAX) addScore(500 * G.mult);
      else {
        G.wpnLv += 1;
        flashWpn();
        toast(wpnText(), false, true);
      }
    } else if (p.kind === 'armor') {
      if (G.armor >= ARMOR) addScore(300 * G.mult);
      else {
        G.armor = Math.min(ARMOR, G.armor + 2);
        audio.armor();
        toast('甲 +', false, true);
      }
    } else if (p.kind === 'bomb') {
      if (G.bombs >= BOMB_CAP) addScore(400 * G.mult);
      else {
        G.bombs += 1;
        toast('爆 +1', false, true);
      }
    }
    floatText(p.x, p.y - 8, p.kind === 'shot' ? '鳞' : p.kind === 'armor' ? '甲' : '爆', GOLD, true);
    syncHud();
  }

  function updateFx(dt) {
    if (G.stop > 0) G.stop = Math.max(0, G.stop - dt);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.8);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 1.6);
    if (G.muzzle > 0) G.muzzle = Math.max(0, G.muzzle - dt);
    if (G.bombFlash > 0) G.bombFlash = Math.max(0, G.bombFlash - dt);
    if (G.bombT > 0) G.bombT = Math.max(0, G.bombT - dt);
    if (G.fireCd > 0) G.fireCd = Math.max(0, G.fireCd - dt);
    if (G.invuln > 0) G.invuln = Math.max(0, G.invuln - dt);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.42) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];
      b.x -= (b.v + scrollSpd() * 0.35) * dt;
      b.y += Math.sin(G.t * 2 + i) * 8 * dt;
      if (b.x < -8) {
        b.x = VW + rand(4, 80);
        b.y = rand(10, VH - 10);
      }
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.x -= m.v * dt;
      if (m.x < -4) {
        m.x = VW + 8;
        m.y = rand(0, VH);
      }
    }
    for (let i = 0; i < schools.length; i++) {
      const s = schools[i];
      s.x -= s.v * dt;
      s.y += Math.sin(G.t * 1.4 + i) * 10 * dt;
      if (s.x < -40) {
        s.x = VW + rand(20, 120);
        s.y = rand(50, VH - 50);
      }
    }
  }

  function autoClearInput() {
    keys.l = false;
    keys.r = false;
    keys.u = false;
    keys.d = false;
    pointer.down = false;
    G.fireHold = false;
  }

  function syncAutoUi() {
    if (!btnAuto) return;
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.textContent = autoOn ? '停下' : '自动';
    btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
  }

  function syncSpeedUi() {
    if (!speedEl) return;
    speedEl.value = String(autoSpeed);
    if (speedLab) speedLab.textContent = SPEED_LABELS[autoSpeed];
    speedEl.title = SPEED_LABELS[autoSpeed];
    speedEl.setAttribute('aria-valuetext', SPEED_LABELS[autoSpeed]);
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
    autoStickS = -1e9;
    autoGate = null;
    autoClearInput();
    autoTx = G.px;
    autoTy = G.py;
    syncAutoUi();
    if (autoOn) {
      audio.ensure();
      if (G.mode === 'title') startGame('raid');
    }
    syncHud();
  }

  function autoScale() {
    if (!autoOn || G.mode !== 'play') return 1;
    return AUTO_SCALE[autoSpeed] || 1;
  }

  function tickAutoFlow(dt) {
    if (!autoOn) return;
    if (G.mode === 'title') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.22 : 0.48)) {
        autoOvWait = 0;
        startGame('raid');
      }
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.65 : 1.1)) {
        autoOvWait = 0;
        startGame(G.kind || 'raid');
      }
    }
  }

  function autoDanger(x, y, horizon) {
    let d = 0;
    const look = horizon;
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      if (s.dead) continue;
      const relx = s.x - x;
      const rely = s.y - y;
      const vv = s.vx * s.vx + s.vy * s.vy;
      let t = 0;
      if (vv > 1) t = clamp(-(relx * s.vx + rely * s.vy) / vv, 0, look);
      const dist = hypot(relx + s.vx * t, rely + s.vy * t);
      const rad = 8.2 + s.r;
      if (t <= look && dist < rad + 32) {
        const soon = (look - t) / Math.max(0.08, look);
        d += Math.max(0.5, rad + 12 - dist) * soon * 24;
        if (dist < rad) d += 220 * soon;
      }
    }
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      if (e.x < -60 || e.x > VW + 80) continue;
      let evx = e.vx || 0;
      let evy = e.vy || 0;
      if (e.type === 'dive' && e.dash > 0 && e.dash < 90) {
        evx = e.vx || 0;
        evy = e.vy || 0;
      } else if (e.type === 'dive') {
        const dd = hypot(x - e.x, y - e.y) || 1;
        evx = (x - e.x) / dd * 230;
        evy = (y - e.y) / dd * 230;
      }
      const relx = e.x - x;
      const rely = e.y - y;
      const vv = evx * evx + evy * evy;
      let t = 0;
      if (vv > 1) t = clamp(-(relx * evx + rely * evy) / vv, 0, look);
      const px = e.x + evx * t;
      const py = e.y + evy * t;
      const r = e.type === 'boss' ? 28 : e.type === 'eel' ? 12 : Math.max(e.w || 16, e.h || 12) * 0.48;
      const dist = hypot(px - x, py - y);
      const hitR = 8.4 + r;
      if (dist < hitR + 28) {
        const soon = (look - t) / Math.max(0.08, look);
        const w = e.type === 'dive' ? 34 : e.type === 'boss' ? 16 : e.type === 'eel' ? 20 : 15;
        d += Math.max(0.4, hitR + 14 - dist) * soon * w;
        if (dist < hitR) d += 250 * soon;
      }
      if (e.type === 'eel' && e.segs) {
        for (let s = 0; s < e.segs.length; s++) {
          if (hypot(e.segs[s].x - x, e.segs[s].y - y) < 18) d += 70;
        }
      }
      if (hypot(e.x - x, e.y - y) < hitR + 6) d += 120;
    }
    return d;
  }

  function autoPickGate() {
    if (!G.fork || !G.gates.length) {
      autoGate = null;
      return null;
    }
    if (autoGate !== 'up' && autoGate !== 'down') {
      autoGate = (G.lives >= 2 && G.bombs >= 1 && G.armor >= 2) ? 'down' : 'up';
    }
    let g = G.gates[0];
    for (let i = 0; i < G.gates.length; i++) {
      if (G.gates[i].side === autoGate) g = G.gates[i];
    }
    return g;
  }

  function autoThink() {
    if (!autoOn) return;
    if (G.mode !== 'play' || G.deadT > 0) {
      G.fireHold = false;
      return;
    }

    const red = isRed();
    const horizon = red ? 0.62 : 0.5;
    let aimY = null;
    let aimX = null;
    let aimW = -1e9;
    let frontN = 0;
    let nearbyShots = 0;
    let boss = null;
    let pick = null;
    let pickW = -1e9;

    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      if (e.x < G.px - 20 || e.x > VW + 40) continue;
      frontN += 1;
      let tx = e.x;
      let ty = e.y;
      let w = 32;
      if (e.type === 'boss') {
        boss = e;
        const wps = weakPoints(e);
        let bestWp = wps[0] || null;
        let bestD = 1e9;
        for (let k = 0; k < wps.length; k++) {
          const dd = Math.abs(wps[k].y - G.py);
          if (dd < bestD) {
            bestD = dd;
            bestWp = wps[k];
          }
        }
        if (bestWp) {
          tx = bestWp.x;
          ty = bestWp.y;
        }
        w = 260 + e.hp * 0.4;
      } else if (e.type === 'carrier') w = 150;
      else if (e.type === 'eel') w = 96;
      else if (e.type === 'dive') w = 88;
      else if (e.type === 'hermit') w = 78;
      else if (e.type === 'squid') w = 64;
      else w = 36 + (e.hp || 1) * 8;
      w -= Math.abs(ty - G.py) * 0.32;
      w -= Math.max(0, tx - G.px) * 0.05;
      if (tx < G.px + 90) w += 16;
      if (w > aimW) {
        aimW = w;
        aimY = ty;
        aimX = tx;
      }
    }

    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      if (s.dead) continue;
      if (hypot(s.x - G.px, s.y - G.py) < 150) nearbyShots += 1;
    }

    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      if (p.dead) continue;
      if (p.x < -8 || p.x > VW - 8) continue;
      let w = 74 - hypot(p.x - G.px, p.y - G.py) * 0.4;
      if (p.kind === 'armor' && G.armor < ARMOR) w += G.armor <= 1 ? 80 : 36;
      else if (p.kind === 'shot' && G.wpnLv < WPN_MAX) w += 52;
      else if (p.kind === 'bomb' && G.bombs < BOMB_CAP) w += G.bombs <= 1 ? 46 : 18;
      else w += 8;
      if (p.x < G.px + 60) w += 28;
      if (w > pickW) {
        pickW = w;
        pick = p;
      }
    }

    const hereDang = autoDanger(G.px, G.py, horizon);
    const gate = autoPickGate();
    const grabPick = pick && (G.invuln > 0.15 || autoDanger(pick.x, pick.y, 0.3) < 40 || pick.x < G.px + 70);

    let desiredX = 108;
    let desiredY = aimY != null ? aimY : VH * 0.5;
    if (hereDang > 80) desiredX = 64;
    else if (frontN >= 6) desiredX = 92;
    else if (boss) desiredX = 128;
    if (aimX != null && aimX < G.px + 140 && !boss) desiredX = clamp(aimX - 70, 50, 160);

    if (grabPick && !gate) {
      desiredX = clamp(pick.x, 28, VW * 0.58);
      desiredY = pick.y;
    }
    if (gate) {
      desiredX = gate.x;
      desiredY = gate.y;
    }

    const xMin = 22;
    const xMax = G.fork ? VW - 28 : VW * 0.62;
    const yMin = 22;
    const yMax = VH - 22;
    let bestX = clamp(autoTx, xMin, xMax);
    let bestY = clamp(autoTy, yMin, yMax);
    let bestS = -1e15;

    function consider(x, y) {
      x = clamp(x, xMin, xMax);
      y = clamp(y, yMin, yMax);
      let s = -autoDanger(x, y, horizon) * (red ? 7.2 : 6);
      s -= Math.abs(x - desiredX) * (gate ? 0.18 : 0.42);
      s -= Math.abs(y - desiredY) * (gate ? 1.15 : 0.95);
      s -= hypot(x - G.px, y - G.py) * 0.12;
      if (!gate && (x < 36 || x > VW * 0.5)) s -= 16;
      if (y < 36 || y > VH - 36) s -= 14;
      if (grabPick && pick && !gate) s -= hypot(x - pick.x, y - pick.y) * 0.55;
      if (gate) s -= hypot(x - gate.x, y - gate.y) * 0.7;
      if (boss && aimY != null && Math.abs(y - aimY) < 14) s += 22;
      if (s > bestS) {
        bestS = s;
        bestX = x;
        bestY = y;
      }
    }

    consider(G.px, G.py);
    consider(autoTx, autoTy);
    consider(desiredX, desiredY);
    for (let ix = 0; ix < 6; ix++) {
      const x = 40 + ix * ((xMax - 48) / 5);
      for (let iy = 0; iy < 9; iy++) {
        consider(x, 32 + iy * ((VH - 64) / 8));
      }
    }
    if (aimY != null) {
      consider(desiredX, aimY);
      consider(G.px, aimY);
      consider(72, aimY);
      consider(desiredX, aimY - 22);
      consider(desiredX, aimY + 22);
    }
    if (grabPick && pick) consider(pick.x, pick.y);
    if (gate) {
      consider(gate.x, gate.y);
      consider(G.px + 80, gate.y);
    }
    consider(G.px, G.py - 48);
    consider(G.px, G.py + 48);
    consider(G.px - 40, G.py);
    consider(G.px + 40, G.py);

    const switchGap = hereDang > 48 ? 8 : 22;
    if (bestS > autoStickS + switchGap || hereDang > 55 || hypot(autoTx - G.px, autoTy - G.py) < 4) {
      autoTx = bestX;
      autoTy = bestY;
      autoStickS = bestS;
    }

    G.fireHold = true;

    const panic = hereDang > 92 || (G.armor <= 1 && hereDang > 58);
    const dense = nearbyShots >= (red ? 7 : 9);
    if (G.bombs > 0 && G.bombT <= 0 && G.invuln < 0.12) {
      if (panic || dense || (boss && nearbyShots >= 6 && hereDang > 70) || (hereDang > 130)) {
        tryBomb();
      }
    }
  }

  function updateMove(dt) {
    if (G.deadT > 0) return;
    const spd = plySpd();
    let dx = 0;
    let dy = 0;
    if (autoOn && G.mode === 'play') {
      dx = autoTx - G.px;
      dy = autoTy - G.py;
      const d = hypot(dx, dy);
      const boost = autoSpeed >= 4 ? 1.22 : autoSpeed >= 3 ? 1.06 : autoSpeed <= 1 ? 0.86 : 0.96;
      if (d > 1.2) {
        const step = Math.min(d, spd * dt * boost);
        G.px += dx / d * step;
        G.py += dy / d * step;
      }
    } else if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      dx = pointer.x - G.px;
      dy = pointer.y - G.py;
      const d = hypot(dx, dy);
      if (d > 4) {
        const step = Math.min(d, spd * dt * 1.15);
        G.px += dx / d * step;
        G.py += dy / d * step;
      }
    } else {
      const v = moveVec(keys.l, keys.r, keys.u, keys.d);
      G.px += v.x * spd * dt;
      G.py += v.y * spd * dt;
    }
    const maxX = G.fork ? VW - 28 : VW * 0.62;
    G.px = clamp(G.px, 22, maxX);
    G.py = clamp(G.py, 20, VH - 20);
  }

  function bossParkX(e) {
    return e.park || VW - 140;
  }

  function fireBoss(e) {
    const red = isRed() ? 1.22 : 1;
    const aim = function (x, y, spd, r, rgb) {
      G.eShots.push(aimShot(x, y, G.px, G.py, spd * red, r, rgb));
    };
    const fan = function (x, y, n, spread, spd, rgb) {
      for (let i = 0; i < n; i++) {
        const a = Math.PI + spread * (i - (n - 1) / 2) / Math.max(1, n - 1);
        G.eShots.push(makeEShot(x, y, Math.cos(a) * spd, Math.sin(a) * spd, 3.8, rgb));
      }
    };
    if (e.kind === 'shark') {
      if (e.phase >= 2 && e.lunge <= 0 && !e.ret && Math.random() < 0.35) {
        e.lunge = 0.55;
        e.vx = -260;
      } else {
        fan(e.x - 50, e.y, e.phase >= 2 ? 5 : 3, 0.7, 180, HOT);
        if (e.phase >= 2) aim(e.x - 46, e.y - 8, 210, 4.2, GOLD);
      }
      e.cd = e.phase >= 2 ? 0.72 : 0.95;
    } else if (e.kind === 'claw') {
      fan(e.x - 70, e.y - 36, 3, 0.5, 190, MAG);
      fan(e.x - 70, e.y + 36, 3, 0.5, 190, MAG);
      if (e.phase >= 2) aim(e.x - 20, e.y, 200, 4.4, GOLD);
      e.cd = e.phase >= 2 ? 0.7 : 0.92;
    } else if (e.kind === 'ray') {
      for (let i = 0; i < (e.phase >= 2 ? 10 : 7); i++) {
        const a = (i / (e.phase >= 2 ? 10 : 7)) * TAU + e.ang;
        G.eShots.push(makeEShot(e.x, e.y, Math.cos(a) * 150, Math.sin(a) * 150, 4.2, TEAL));
      }
      if (e.phase >= 2) aim(e.x, e.y, 240, 4.6, GOLD);
      e.cd = e.phase >= 2 ? 0.84 : 1.12;
    } else if (e.kind === 'whale') {
      e.open = 1;
      for (let i = 0; i < 6; i++) {
        G.eShots.push(makeEShot(e.x - 80, e.y + rand(-10, 18), -220 - i * 8, rand(-30, 30), 4.4, HOT));
      }
      if (e.phase >= 2) {
        for (let i = 0; i < 5; i++) {
          G.eShots.push(makeEShot(80 + i * 120, 8, 0, 170, 4, MAG));
        }
      }
      e.cd = e.phase >= 2 ? 0.78 : 1.05;
    } else if (e.kind === 'horse') {
      for (let i = 0; i < 8; i++) {
        const a = e.ang + i * (TAU / 8);
        G.eShots.push(makeEShot(e.x, e.y + 8, Math.cos(a) * 160, Math.sin(a) * 160, 3.6, PNK));
      }
      if (e.phase >= 2) aim(e.x - 10, e.y, 230, 4.2, GOLD);
      e.cd = e.phase >= 2 ? 0.68 : 0.9;
    } else if (e.kind === 'maw') {
      if (e.phase < 2) {
        aim(e.x - 36, e.y - 56, 180, 4.8, GOLD);
        fan(e.x - 20, e.y, 3, 0.4, 150, MAG);
        e.cd = 0.86;
      } else {
        fan(e.x - 54, e.y + 4, 7, 0.95, 200, HOT);
        aim(e.x - 54, e.y, 250, 5, GOLD);
        e.cd = 0.7;
      }
    }
    capArr(G.eShots, isRed() ? 140 : 96);
  }

  function updateBoss(e, dt) {
    e.t += dt;
    e.ang += dt * (e.kind === 'horse' ? 2.2 : 1.1);
    if (e.hp < e.maxhp * 0.5) e.phase = Math.max(e.phase, 2);
    if (e.flash > 0) e.flash -= dt;
    if (e.weakFlash > 0) e.weakFlash -= dt;
    if (e.hitT > 0) e.hitT -= dt;
    if (e.open > 0) e.open = Math.max(0, e.open - dt);
    const park = bossParkX(e);
    if (e.lunge > 0) {
      e.x += e.vx * dt;
      e.lunge -= dt;
      if (e.lunge <= 0 || e.x < 220) {
        e.lunge = 0;
        e.ret = true;
        e.vx = 90;
      }
    } else if (e.ret) {
      e.x += 110 * dt;
      if (e.x >= park) {
        e.x = park;
        e.ret = false;
        e.vx = 0;
      }
    } else if (e.x > park) {
      e.x += Math.min(-40, (park - e.x) * 1.4) * dt * 4;
      if (e.x <= park) e.x = park;
    } else {
      e.x = park;
      if (e.kind === 'horse') e.y = VH * 0.5 + Math.sin(e.t * 1.6) * 110;
      else if (e.kind === 'ray') e.y = VH * 0.5 + Math.sin(e.t * 1.15) * 70;
      else if (e.kind === 'claw') e.y = VH * 0.5 + Math.sin(e.t * 0.8) * 28;
      else e.y = VH * 0.5 + Math.sin(e.t * 0.7) * 36;
    }
    e.y = clamp(e.y, 70, VH - 70);
    e.cd -= dt;
    if (e.cd <= 0 && G.deadT <= 0 && !G.fork) fireBoss(e);
  }

  function updateEnts(dt) {
    const red = isRed();
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (e.dead) {
        G.ents.splice(i, 1);
        continue;
      }
      if (e.hitT > 0) e.hitT -= dt;
      if (e.type === 'boss') {
        updateBoss(e, dt);
        continue;
      }
      if (e.type === 'minnow') {
        e.bob += dt * 3.2;
        e.x += e.vx * dt;
        e.y = e.baseY + Math.sin(e.bob) * e.amp;
      } else if (e.type === 'puffer') {
        e.x += e.vx * dt;
        e.inflate = 0.7 + Math.sin(G.t * 3 + e.x * 0.02) * 0.3;
        e.cd -= dt;
        if (e.cd <= 0 && e.x < VW - 40) {
          e.cd = red ? 1.15 : 1.5;
          for (let k = 0; k < 6; k++) {
            const a = k * TAU / 6;
            G.eShots.push(makeEShot(e.x, e.y, Math.cos(a) * 150, Math.sin(a) * 150, 3.4, PNK));
          }
        }
      } else if (e.type === 'ray') {
        e.bob += dt * 2.1;
        e.x += e.vx * dt;
        e.y = e.baseY + Math.sin(e.bob) * e.amp;
        e.cd -= dt;
        if (e.cd <= 0 && e.x < VW - 20) {
          e.cd = red ? 1.05 : 1.4;
          G.eShots.push(aimShot(e.x - 8, e.y, G.px, G.py, red ? 200 : 170, 3.6, CYN));
        }
      } else if (e.type === 'squid') {
        e.pulse += dt * 4;
        e.x += (e.vx + Math.sin(e.pulse) * 40) * dt;
        e.y += Math.sin(e.pulse * 0.5) * 18 * dt;
        e.cd -= dt;
        if (e.cd <= 0 && e.x < VW - 10) {
          e.cd = red ? 1.1 : 1.45;
          G.eShots.push(makeEShot(e.x - 6, e.y + 8, -80, 70, 4.4, MAG));
          G.eShots.push(makeEShot(e.x - 6, e.y + 8, -80, 110, 4.4, MAG));
        }
      } else if (e.type === 'hermit') {
        e.x += e.vx * dt;
        e.cd -= dt;
        if (e.cd <= 0 && e.x < VW - 8) {
          e.cd = red ? 0.95 : 1.28;
          e.flash = 0.12;
          G.eShots.push(aimShot(e.x, e.y, G.px, G.py, red ? 230 : 190, 3.8, HOT));
        }
        if (e.flash > 0) e.flash -= dt;
      } else if (e.type === 'carrier') {
        e.bob += dt;
        e.x += e.vx * dt;
        e.y = e.baseY + Math.sin(e.bob * 1.4) * 22;
      } else if (e.type === 'eel') {
        e.bob += dt * 2.4;
        e.x += e.vx * dt;
        e.y = e.baseY + Math.sin(e.bob) * 48;
        if (e.segs && e.segs.length) {
          e.segs[0].x = e.x;
          e.segs[0].y = e.y;
          for (let s = 1; s < e.segs.length; s++) {
            const p = e.segs[s - 1];
            const c = e.segs[s];
            const dx = p.x - c.x;
            const dy = p.y - c.y;
            const d = hypot(dx, dy) || 1;
            const want = 11;
            c.x += (dx / d) * (d - want) * 0.18;
            c.y += (dy / d) * (d - want) * 0.18;
          }
        }
      } else if (e.type === 'dive') {
        e.dash -= dt;
        if (e.dash <= 0) {
          const d = hypot(G.px - e.x, G.py - e.y) || 1;
          e.vx = (G.px - e.x) / d * (red ? 280 : 230);
          e.vy = (G.py - e.y) / d * (red ? 280 : 230);
          e.dash = 99;
        }
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      }
      if (e.x < -80 || e.y < -80 || e.y > VH + 80) {
        e.dead = true;
        G.ents.splice(i, 1);
      }
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.dead || s.life <= 0 || s.x > VW + 30 || s.y < -20 || s.y > VH + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.ents.length; j++) {
        const e = G.ents[j];
        if (e.dead) continue;
        if (e.type === 'boss') {
          const wps = weakPoints(e);
          let weak = null;
          for (let k = 0; k < wps.length; k++) {
            if (hypot(s.x - wps[k].x, s.y - wps[k].y) < wps[k].r + s.r) {
              weak = wps[k];
              break;
            }
          }
          if (weak) {
            hurtEnt(e, s.dmg, s.x, s.y, true);
            hit = true;
            break;
          }
          if (bodyHit(e, s.x, s.y, s.r)) {
            const bodyMul = e.kind === 'maw' && e.phase < 2 ? 0.18 : 0.4;
            hurtEnt(e, s.dmg * bodyMul, s.x, s.y, false);
            hit = true;
            break;
          }
        } else if (bodyHit(e, s.x, s.y, s.r + 2)) {
          hurtEnt(e, s.dmg, s.x, s.y, false);
          hit = true;
          break;
        }
      }
      if (hit) {
        s.dead = true;
        G.shots.splice(i, 1);
      }
    }
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.dead || s.life <= 0 || s.x < -16 || s.x > VW + 24 || s.y < -16 || s.y > VH + 16) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.deadT <= 0 && hypot(s.x - G.px, s.y - G.py) < s.r + 8) {
        s.dead = true;
        G.eShots.splice(i, 1);
        hurtPlayer(1, 'shot', s.x, s.y);
      }
    }
  }

  function updatePows(dt) {
    for (let i = G.pows.length - 1; i >= 0; i--) {
      const p = G.pows[i];
      p.x += p.vx * dt;
      p.bob += dt;
      p.y += Math.sin(p.bob * 3) * 18 * dt;
      p.y = clamp(p.y, 24, VH - 24);
      if (p.dead || p.x < -24) {
        G.pows.splice(i, 1);
        continue;
      }
      if (G.deadT <= 0 && hypot(p.x - G.px, p.y - G.py) < p.r + 10) {
        collectPow(p);
        G.pows.splice(i, 1);
      }
    }
  }

  function updateGates(dt) {
    if (!G.fork) return;
    G.forkT -= dt;
    for (let i = 0; i < G.gates.length; i++) {
      const g = G.gates[i];
      g.t += dt;
      if (G.deadT <= 0 && hypot(g.x - G.px, g.y - G.py) < g.r + 8) {
        pickGate(g);
        return;
      }
    }
    if (G.forkT <= 0 && G.gates.length) {
      pickGate(G.py < VH * 0.5 ? G.gates[0] : G.gates[1]);
    }
  }

  function maybeSpawn() {
    if (G.fork || G.bossIn || G.winT > 0) return;
    const z = zoneOf(G.zone);
    while (G.waveI < z.waves.length && G.zoneT >= z.waves[G.waveI].t) {
      spawnWave(z.waves[G.waveI]);
      G.waveI += 1;
    }
  }

  function update(dt) {
    tickAutoFlow(dt);
    if (autoOn && autoSpeed >= 4 && G.mode === 'play') G.stop = 0;
    updateFx(dt);
    if (G.mode !== 'play') {
      G.t += dt;
      G.scroll += 26 * dt;
      return;
    }
    if (G.stop > 0) return;
    G.t += dt;
    G.scroll += scrollSpd() * dt;
    if (G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          goLose();
          return;
        }
        respawn();
      }
    }
    if (G.winT > 0) {
      G.winT -= dt;
      if (G.winT <= 0) {
        goWin();
        return;
      }
    }
    G.zoneT += dt;
    if (autoOn) autoThink();
    updateMove(dt);
    if (G.fireHold && G.deadT <= 0) fire();
    if (!REDUCE && G.deadT <= 0 && ((G.t * 22) | 0) !== (((G.t - dt) * 22) | 0)) {
      emit(1, {
        x: G.px - 12, y: G.py, j: 2.4,
        vx0: -80, vx1: -20, vy0: -16, vy1: 16,
        r0: 1.1, r1: 2.4, life: 0.2, rgb: GOLD, g: 0
      });
    }
    maybeSpawn();
    updateEnts(dt);
    updateShots(dt);
    updatePows(dt);
    updateGates(dt);
    if (G.deadT <= 0) {
      for (let i = 0; i < G.ents.length; i++) {
        const e = G.ents[i];
        if (e.dead) continue;
        if (bodyHit(e, G.px, G.py, 8)) {
          if (e.type === 'boss') hurtPlayer(2, 'crash', G.px, G.py);
          else {
            const wasAlive = G.deadT <= 0;
            hurtPlayer(1, 'crash', e.x, e.y);
            if (wasAlive && !e.dead) killEnt(e, false);
          }
        }
      }
    }
    if (comboEl) {
      if (G.combo >= 2 && G.mode === 'play') {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? G.combo + ' 连 ×' + G.mult : G.combo + ' 连';
      } else comboEl.hidden = true;
    }
    if (hpBar) hpBar.style.transform = 'scaleX(' + clamp(G.armor / ARMOR, 0, 1) + ')';
    if (hpWrap) hpWrap.classList.toggle('warn', G.armor <= 1);
  }

  function drawSea() {
    const c = ctx;
    const z = zoneOf(G.zone);
    const rgb = hueRgb(z.hue, 0.55, 0.18);
    const top = hueRgb((z.hue + 28) % 360, 0.4, 0.12);
    const g = c.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, rgba(top, 1));
    g.addColorStop(0.55, rgba(rgb, 1));
    g.addColorStop(1, rgba(DEEP, 1));
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    if (!REDUCE) {
      c.globalAlpha = 0.16;
      for (let i = 0; i < 5; i++) {
        const yy = ((G.t * 18 + i * 70 + G.scroll * 0.08) % (VH + 40)) - 20;
        c.fillStyle = rgba(TEAL, 0.18);
        c.beginPath();
        c.ellipse(sx(VW * 0.55), sy(yy), 220 * scale, 16 * scale, 0, 0, TAU);
        c.fill();
      }
      c.globalAlpha = 1;
    }

    c.fillStyle = rgba(SEA, 0.85);
    const step = 16;
    c.beginPath();
    c.moveTo(sx(-10), sy(-4));
    for (let x = -16; x <= VW + 20; x += step) {
      const wx = G.scroll + x;
      const n = hash2((wx / 28) | 0) * 22 + Math.sin(wx * 0.02) * 8;
      c.lineTo(sx(x), sy(18 + n));
    }
    c.lineTo(sx(VW + 20), sy(-4));
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(sx(-10), sy(VH + 4));
    for (let x = -16; x <= VW + 20; x += step) {
      const wx = G.scroll * 1.1 + x;
      const n = hash2((wx / 26 + 9) | 0) * 24 + Math.sin(wx * 0.018) * 9;
      c.lineTo(sx(x), sy(VH - 18 - n));
    }
    c.lineTo(sx(VW + 20), sy(VH + 4));
    c.closePath();
    c.fill();

    c.strokeStyle = rgba(GOLD, 0.22);
    c.lineWidth = Math.max(1, 1.2 * scale);
    c.beginPath();
    for (let x = -16; x <= VW + 20; x += step) {
      const wx = G.scroll + x;
      const n = hash2((wx / 28) | 0) * 22 + Math.sin(wx * 0.02) * 8;
      if (x === -16) c.moveTo(sx(x), sy(18 + n));
      else c.lineTo(sx(x), sy(18 + n));
    }
    c.stroke();
    c.beginPath();
    for (let x = -16; x <= VW + 20; x += step) {
      const wx = G.scroll * 1.1 + x;
      const n = hash2((wx / 26 + 9) | 0) * 24 + Math.sin(wx * 0.018) * 9;
      if (x === -16) c.moveTo(sx(x), sy(VH - 18 - n));
      else c.lineTo(sx(x), sy(VH - 18 - n));
    }
    c.stroke();

    for (let i = 0; i < schools.length; i++) {
      const s = schools[i];
      c.fillStyle = rgba(CYN, 0.12);
      for (let k = 0; k < s.n; k++) {
        const fx = s.x + k * 9;
        const fy = s.y + Math.sin(G.t * 3 + k) * 4;
        c.beginPath();
        c.ellipse(sx(fx), sy(fy), 5 * s.s * scale, 2.2 * s.s * scale, 0, 0, TAU);
        c.fill();
      }
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      c.fillStyle = rgba(WHT, m.a);
      c.fillRect(sx(m.x), sy(m.y), m.s * scale, m.s * scale);
    }
    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];
      c.strokeStyle = rgba(TEAL, 0.28);
      c.lineWidth = Math.max(1, 1 * scale);
      c.beginPath();
      c.arc(sx(b.x), sy(b.y), b.r * scale, 0, TAU);
      c.stroke();
    }
  }

  function drawHawk() {
    if (G.deadT > 0) return;
    if (G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0) return;
    const c = ctx;
    const x = G.px;
    const y = G.py;
    c.save();
    c.translate(sx(x), sy(y));
    if (G.muzzle > 0) {
      c.fillStyle = rgba(GOLD, 0.85);
      c.beginPath();
      c.ellipse(18 * scale, 0, 10 * scale, 3.4 * scale, 0, 0, TAU);
      c.fill();
    }
    c.fillStyle = rgba(HOT, 0.7);
    c.beginPath();
    c.ellipse(-14 * scale, 0, 10 * scale, 3.2 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(WHT, 0.96);
    c.beginPath();
    c.moveTo(16 * scale, 0);
    c.lineTo(-6 * scale, -7 * scale);
    c.lineTo(-10 * scale, 0);
    c.lineTo(-6 * scale, 7 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(CYN, 0.95);
    c.beginPath();
    c.moveTo(2 * scale, -2 * scale);
    c.lineTo(-16 * scale, -12 * scale);
    c.lineTo(-6 * scale, -1 * scale);
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(2 * scale, 2 * scale);
    c.lineTo(-16 * scale, 12 * scale);
    c.lineTo(-6 * scale, 1 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(GOLD, 0.95);
    c.fillRect(-2 * scale, -2.4 * scale, 10 * scale, 4.8 * scale);
    c.restore();
  }

  function drawWeak(e) {
    const pts = weakPoints(e);
    const c = ctx;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const pulse = 1 + Math.sin(G.t * 9) * 0.18;
      const r = p.r * pulse;
      c.fillStyle = rgba(GOLD, e.weakFlash > 0 ? 0.95 : 0.72);
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), r * scale, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(WHT, 0.85);
      c.lineWidth = Math.max(1, 1.4 * scale);
      c.stroke();
      c.fillStyle = rgba(WHT, 0.9);
      c.beginPath();
      c.arc(sx(p.x - 2), sy(p.y - 2), r * 0.28 * scale, 0, TAU);
      c.fill();
    }
  }

  function flashCol(base, e) {
    return e.hitT > 0 ? WHT : base;
  }

  function drawMinnow(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x), sy(e.y));
    c.fillStyle = rgba(flashCol(CYN, e), 0.95);
    c.beginPath();
    c.moveTo(-10 * scale, 0);
    c.lineTo(8 * scale, -5 * scale);
    c.lineTo(5 * scale, 0);
    c.lineTo(8 * scale, 5 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(GOLD, 0.7);
    c.fillRect(-2 * scale, -1.6 * scale, 5 * scale, 3.2 * scale);
    c.restore();
  }

  function drawPuffer(e) {
    const c = ctx;
    const inf = e.inflate || 1;
    c.save();
    c.translate(sx(e.x), sy(e.y));
    c.fillStyle = rgba(flashCol(PNK, e), 0.92);
    c.beginPath();
    c.arc(0, 0, 10 * inf * scale, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(GOLD, 0.7);
    c.lineWidth = Math.max(1, 1.2 * scale);
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8;
      c.beginPath();
      c.moveTo(Math.cos(a) * 9 * inf * scale, Math.sin(a) * 9 * inf * scale);
      c.lineTo(Math.cos(a) * 13 * inf * scale, Math.sin(a) * 13 * inf * scale);
      c.stroke();
    }
    c.restore();
  }

  function drawRayFish(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x), sy(e.y));
    c.fillStyle = rgba(flashCol(TEAL, e), 0.92);
    c.beginPath();
    c.moveTo(16 * scale, 0);
    c.lineTo(0, -12 * scale);
    c.lineTo(-16 * scale, 0);
    c.lineTo(0, 12 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(GOLD, 0.5);
    c.beginPath();
    c.arc(-2 * scale, 0, 3 * scale, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawSquid(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x), sy(e.y));
    c.fillStyle = rgba(flashCol(MAG, e), 0.92);
    c.beginPath();
    c.ellipse(0, -4 * scale, 8 * scale, 11 * scale, 0, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(PNK, 0.8);
    c.lineWidth = Math.max(1, 1.4 * scale);
    for (let i = -2; i <= 2; i++) {
      c.beginPath();
      c.moveTo(i * 3 * scale, 6 * scale);
      c.quadraticCurveTo(i * 5 * scale, 14 * scale, i * 2 * scale, 18 * scale);
      c.stroke();
    }
    c.restore();
  }

  function drawHermit(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x), sy(e.y));
    c.fillStyle = rgba(flashCol(HOT, e), 0.95);
    c.beginPath();
    c.ellipse(0, 0, 11 * scale, 8 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(GOLD, e.flash > 0 ? 0.95 : 0.6);
    c.fillRect(-2 * scale, e.top ? 4 * scale : -10 * scale, 4 * scale, 8 * scale);
    c.restore();
  }

  function drawCarrier(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x), sy(e.y));
    c.fillStyle = rgba(flashCol(GOLD, e), 0.92);
    c.beginPath();
    c.ellipse(0, 0, 18 * scale, 9 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(DEEP, 0.8);
    c.beginPath();
    c.ellipse(-4 * scale, 0, 7 * scale, 4 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(TEAL, 0.9);
    c.beginPath();
    c.arc(8 * scale, 0, 4 * scale, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawEel(e) {
    const c = ctx;
    if (!e.segs) return;
    for (let i = e.segs.length - 1; i >= 0; i--) {
      const s = e.segs[i];
      c.fillStyle = rgba(flashCol(i === 0 ? GOLD : CYN, e), 0.9 - i * 0.04);
      c.beginPath();
      c.ellipse(sx(s.x), sy(s.y), (i === 0 ? 8 : 6) * scale, 4 * scale, 0, 0, TAU);
      c.fill();
    }
  }

  function drawDive(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x), sy(e.y));
    c.fillStyle = rgba(flashCol(HOT, e), 0.95);
    c.beginPath();
    c.moveTo(10 * scale, 0);
    c.lineTo(-8 * scale, -5 * scale);
    c.lineTo(-8 * scale, 5 * scale);
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawBossShark(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x), sy(e.y));
    c.fillStyle = rgba(flashCol(SEA, e), 0.96);
    c.beginPath();
    c.ellipse(-8 * scale, 0, 78 * scale, 28 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(CYN, 0.85);
    c.beginPath();
    c.moveTo(60 * scale, 0);
    c.lineTo(88 * scale, -22 * scale);
    c.lineTo(74 * scale, 0);
    c.lineTo(88 * scale, 22 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(hueRgb(48, 0.5, 0.28), 0.95);
    c.beginPath();
    c.moveTo(-10 * scale, -26 * scale);
    c.lineTo(8 * scale, -52 * scale);
    c.lineTo(18 * scale, -24 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.9);
    c.beginPath();
    c.moveTo(-78 * scale, -8 * scale);
    c.lineTo(-108 * scale, -4 * scale);
    c.lineTo(-78 * scale, 2 * scale);
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(-78 * scale, 10 * scale);
    c.lineTo(-102 * scale, 8 * scale);
    c.lineTo(-78 * scale, 2 * scale);
    c.closePath();
    c.fill();
    c.restore();
    drawWeak(e);
  }

  function drawBossClaw(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x), sy(e.y));
    c.fillStyle = rgba(flashCol(hueRgb(18, 0.55, 0.32), e), 0.95);
    c.beginPath();
    c.ellipse(10 * scale, 0, 36 * scale, 28 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(MAG, 0.88);
    c.beginPath();
    c.ellipse(-56 * scale, -36 * scale, 28 * scale, 14 * scale, -0.3, 0, TAU);
    c.fill();
    c.beginPath();
    c.ellipse(-56 * scale, 36 * scale, 28 * scale, 14 * scale, 0.3, 0, TAU);
    c.fill();
    c.fillStyle = rgba(HOT, 0.8);
    c.fillRect(-20 * scale, -40 * scale, 10 * scale, 28 * scale);
    c.fillRect(-20 * scale, 12 * scale, 10 * scale, 28 * scale);
    c.restore();
    drawWeak(e);
  }

  function drawBossRay(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x), sy(e.y));
    c.fillStyle = rgba(flashCol(hueRgb(188, 0.5, 0.28), e), 0.95);
    c.beginPath();
    c.moveTo(70 * scale, 0);
    c.lineTo(0, -46 * scale);
    c.lineTo(-80 * scale, 0);
    c.lineTo(0, 46 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(TEAL, 0.45);
    c.beginPath();
    c.ellipse(0, 0, 22 * scale, 16 * scale, 0, 0, TAU);
    c.fill();
    c.restore();
    drawWeak(e);
  }

  function drawBossWhale(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x), sy(e.y));
    c.fillStyle = rgba(flashCol(hueRgb(42, 0.4, 0.28), e), 0.96);
    c.beginPath();
    c.ellipse(8 * scale, 0, 108 * scale, 48 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(CYN, 0.7);
    c.beginPath();
    c.moveTo(90 * scale, -8 * scale);
    c.lineTo(128 * scale, -28 * scale);
    c.lineTo(110 * scale, 0);
    c.lineTo(128 * scale, 22 * scale);
    c.lineTo(90 * scale, 8 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(DEEP, 0.7);
    c.beginPath();
    c.ellipse(-70 * scale, 6 * scale, 28 * scale, 16 * scale, 0, 0, TAU);
    c.fill();
    c.restore();
    drawWeak(e);
  }

  function drawBossHorse(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x), sy(e.y));
    c.strokeStyle = rgba(flashCol(PNK, e), 0.95);
    c.lineWidth = Math.max(2, 10 * scale);
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(6 * scale, -70 * scale);
    c.quadraticCurveTo(-30 * scale, -20 * scale, 8 * scale, 10 * scale);
    c.quadraticCurveTo(36 * scale, 40 * scale, 4 * scale, 78 * scale);
    c.stroke();
    c.fillStyle = rgba(flashCol(hueRgb(352, 0.5, 0.4), e), 0.95);
    c.beginPath();
    c.ellipse(4 * scale, -58 * scale, 16 * scale, 14 * scale, -0.4, 0, TAU);
    c.fill();
    c.fillStyle = rgba(GOLD, 0.5);
    c.beginPath();
    c.arc(4 * scale, 8 * scale, 10 * scale, 0, TAU);
    c.fill();
    c.restore();
    drawWeak(e);
  }

  function drawBossMaw(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x), sy(e.y));
    c.fillStyle = rgba(flashCol(hueRgb(28, 0.5, 0.26), e), 0.96);
    c.beginPath();
    c.ellipse(6 * scale, 8 * scale, 64 * scale, 52 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(DEEP, 0.85);
    c.beginPath();
    c.ellipse(-40 * scale, 6 * scale, e.phase >= 2 ? 32 * scale : 18 * scale, e.phase >= 2 ? 22 * scale : 10 * scale, 0, 0, TAU);
    c.fill();
    if (e.phase < 2) {
      c.strokeStyle = rgba(GOLD, 0.8);
      c.lineWidth = Math.max(1, 2 * scale);
      c.beginPath();
      c.moveTo(-10 * scale, -28 * scale);
      c.lineTo(-36 * scale, -56 * scale);
      c.stroke();
      c.fillStyle = rgba(GOLD, 0.9);
      c.beginPath();
      c.arc(-36 * scale, -56 * scale, 7 * scale, 0, TAU);
      c.fill();
    }
    c.restore();
    drawWeak(e);
  }

  function drawBoss(e) {
    if (e.kind === 'shark') drawBossShark(e);
    else if (e.kind === 'claw') drawBossClaw(e);
    else if (e.kind === 'ray') drawBossRay(e);
    else if (e.kind === 'whale') drawBossWhale(e);
    else if (e.kind === 'horse') drawBossHorse(e);
    else drawBossMaw(e);
  }

  function drawEnt(e) {
    if (e.type === 'boss') drawBoss(e);
    else if (e.type === 'minnow') drawMinnow(e);
    else if (e.type === 'puffer') drawPuffer(e);
    else if (e.type === 'ray') drawRayFish(e);
    else if (e.type === 'squid') drawSquid(e);
    else if (e.type === 'hermit') drawHermit(e);
    else if (e.type === 'carrier') drawCarrier(e);
    else if (e.type === 'eel') drawEel(e);
    else if (e.type === 'dive') drawDive(e);
  }

  function drawShots() {
    const c = ctx;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      c.fillStyle = rgba(GOLD, 0.95);
      c.beginPath();
      c.moveTo(sx(s.x + 7), sy(s.y));
      c.lineTo(sx(s.x - 4), sy(s.y - 3.2));
      c.lineTo(sx(s.x - 4), sy(s.y + 3.2));
      c.closePath();
      c.fill();
      if (!REDUCE) {
        c.fillStyle = rgba(HOT, 0.35);
        c.fillRect(sx(s.x - 12), sy(s.y - 1), 10 * scale, 2 * scale);
      }
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      c.fillStyle = rgba(s.rgb || HOT, 0.95);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.45);
      c.beginPath();
      c.arc(sx(s.x - 1), sy(s.y - 1), s.r * 0.4 * scale, 0, TAU);
      c.fill();
    }
  }

  function drawPows() {
    const c = ctx;
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const rgb = p.kind === 'armor' ? TEAL : p.kind === 'bomb' ? MAG : GOLD;
      c.save();
      c.translate(sx(p.x), sy(p.y));
      c.rotate(G.t * 2);
      c.fillStyle = rgba(rgb, 0.95);
      c.beginPath();
      c.moveTo(0, -11 * scale);
      c.lineTo(9 * scale, 0);
      c.lineTo(0, 11 * scale);
      c.lineTo(-9 * scale, 0);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(DEEP, 0.85);
      c.font = 'bold ' + Math.round(10 * scale) + 'px sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.rotate(-G.t * 2);
      c.fillText(p.kind === 'armor' ? '甲' : p.kind === 'bomb' ? '爆' : '鳞', 0, 1);
      c.restore();
    }
  }

  function drawGates() {
    if (!G.fork) return;
    const c = ctx;
    for (let i = 0; i < G.gates.length; i++) {
      const g = G.gates[i];
      const pulse = 1 + Math.sin(G.t * 6 + i) * 0.08;
      const rgb = g.side === 'up' ? GOLD : CYN;
      c.strokeStyle = rgba(rgb, 0.9);
      c.lineWidth = Math.max(2, 2.4 * scale);
      c.beginPath();
      c.arc(sx(g.x), sy(g.y), g.r * pulse * scale, 0, TAU);
      c.stroke();
      c.fillStyle = rgba(rgb, 0.18);
      c.beginPath();
      c.arc(sx(g.x), sy(g.y), (g.r - 4) * pulse * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.95);
      c.font = 'bold ' + Math.round(14 * scale) + 'px sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(g.side === 'up' ? '上 ' + g.next : '下 ' + g.next, sx(g.x), sy(g.y));
      const nz = zoneOf(g.next);
      c.font = Math.round(10 * scale) + 'px sans-serif';
      c.fillStyle = rgba(rgb, 0.9);
      c.fillText(nz.name, sx(g.x), sy(g.y + 18));
    }
  }

  function drawFx() {
    const c = ctx;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      c.fillStyle = rgba(p.rgb, clamp(p.life / p.max, 0, 1));
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t / 0.28;
      c.strokeStyle = rgba(s.rgb, a);
      c.lineWidth = Math.max(1, 2 * scale);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), (s.rad + s.t * 40) * scale, 0, TAU);
      c.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t / 0.42;
      c.strokeStyle = rgba(r.rgb, a * 0.8);
      c.lineWidth = Math.max(1, 3 * scale);
      c.beginPath();
      c.arc(sx(r.x), sy(r.y), (r.r + r.t * 140) * scale, 0, TAU);
      c.stroke();
    }
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      c.globalAlpha = a;
      c.fillStyle = rgba(f.rgb, 1);
      c.font = 'bold ' + Math.round(f.size * scale) + 'px sans-serif';
      c.textAlign = 'center';
      c.fillText(f.text, sx(f.x), sy(f.y));
      c.globalAlpha = 1;
    }
  }

  function drawMap() {
    const c = ctx;
    const bx = 14;
    const by = 14;
    const bw = 108;
    const bh = 72;
    c.fillStyle = 'rgba(12,9,2,0.42)';
    c.fillRect(sx(bx), sy(by), bw * scale, bh * scale);
    c.strokeStyle = rgba(GOLD, 0.28);
    c.lineWidth = Math.max(1, 1 * scale);
    c.strokeRect(sx(bx), sy(by), bw * scale, bh * scale);
    const ids = ['A', 'B', 'C', 'D', 'E', 'F'];
    const edges = [['A', 'B'], ['A', 'C'], ['B', 'D'], ['B', 'E'], ['C', 'E'], ['C', 'F']];
    function pt(id) {
      const p = MAP_POS[id];
      return { x: bx + 8 + p[0] * (bw - 16), y: by + 8 + p[1] * (bh - 16) };
    }
    c.strokeStyle = rgba(CYN, 0.35);
    c.lineWidth = Math.max(1, 1 * scale);
    for (let i = 0; i < edges.length; i++) {
      const a = pt(edges[i][0]);
      const b = pt(edges[i][1]);
      c.beginPath();
      c.moveTo(sx(a.x), sy(a.y));
      c.lineTo(sx(b.x), sy(b.y));
      c.stroke();
    }
    if (G.path.length > 1) {
      c.strokeStyle = rgba(GOLD, 0.9);
      c.lineWidth = Math.max(1, 1.6 * scale);
      c.beginPath();
      for (let i = 0; i < G.path.length; i++) {
        const p = pt(G.path[i]);
        if (i === 0) c.moveTo(sx(p.x), sy(p.y));
        else c.lineTo(sx(p.x), sy(p.y));
      }
      c.stroke();
    }
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const p = pt(id);
      const on = G.path.indexOf(id) >= 0;
      const cur = G.zone === id;
      c.fillStyle = rgba(cur ? GOLD : on ? CYN : WHT, cur ? 0.95 : on ? 0.7 : 0.35);
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), (cur ? 5 : 3.4) * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, cur ? 0.95 : 0.55);
      c.font = Math.round(8 * scale) + 'px sans-serif';
      c.textAlign = 'center';
      c.fillText(id, sx(p.x), sy(p.y - 8));
    }
  }

  function drawBossBar() {
    if (G.mode !== 'play') return;
    let boss = null;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'boss' && !G.ents[i].dead) {
        boss = G.ents[i];
        break;
      }
    }
    if (!boss) return;
    const c = ctx;
    const x = VW * 0.28;
    const y = 18;
    const w = VW * 0.5;
    c.fillStyle = 'rgba(12,9,2,0.55)';
    c.fillRect(sx(x), sy(y), w * scale, 10 * scale);
    c.fillStyle = rgba(GOLD, 0.9);
    c.fillRect(sx(x), sy(y), w * (boss.hp / boss.maxhp) * scale, 10 * scale);
    c.strokeStyle = rgba(WHT, 0.45);
    c.lineWidth = Math.max(1, 1 * scale);
    c.strokeRect(sx(x), sy(y), w * scale, 10 * scale);
    c.fillStyle = rgba(GOLD, 0.9);
    c.font = Math.round(10 * scale) + 'px sans-serif';
    c.textAlign = 'center';
    c.fillText(boss.name, sx(VW * 0.5), sy(y - 4));
  }

  function draw() {
    const c = ctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = '#080604';
    c.fillRect(0, 0, W, H);
    c.save();
    let kx = 0;
    let ky = 0;
    if (G.shake > 0 && !REDUCE) {
      kx = (Math.random() - 0.5) * G.shake * 1.4;
      ky = (Math.random() - 0.5) * G.shake * 1.2;
    }
    c.translate(kx, ky);
    if (G.punch !== 1 && !REDUCE) {
      c.translate(sx(VW * 0.5), sy(VH * 0.5));
      c.scale(G.punch, G.punch);
      c.translate(-sx(VW * 0.5), -sy(VH * 0.5));
    }
    drawSea();
    for (let i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawPows();
    drawShots();
    drawHawk();
    drawGates();
    drawFx();
    drawMap();
    drawBossBar();
    if (G.flash > 0) {
      c.fillStyle = rgba(G.flashRgb || GOLD, G.flash);
      c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    if (G.bombFlash > 0) {
      c.strokeStyle = rgba(GOLD, G.bombFlash);
      c.lineWidth = Math.max(2, 6 * scale);
      c.strokeRect(sx(4), sy(4), (VW - 8) * scale, (VH - 8) * scale);
    }
    c.restore();
  }

  function resize() {
    if (!canvas || !stageEl) return;
    const rect = stageEl.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function pointerWorld(e) {
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const x = (cssX / Math.max(1, rect.width)) * W;
    const y = (cssY / Math.max(1, rect.height)) * H;
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function startGame(kind) {
    G.kind = kind === 'red' ? 'red' : 'raid';
    G.mode = 'play';
    G.t = 0;
    G.zone = 'A';
    G.path = ['A'];
    G.zoneT = 0;
    G.waveI = 0;
    G.scroll = 0;
    G.px = 90;
    G.py = VH * 0.5;
    G.lives = LIVES;
    G.armor = ARMOR;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.wpnLv = 0;
    G.bombs = 3;
    G.bombT = 0;
    G.bombFlash = 0;
    G.fireCd = 0;
    G.fireHold = false;
    G.deadT = 0;
    G.invuln = 1.15;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.fork = false;
    G.forkT = 0;
    G.winT = 0;
    G.nextLife = LIFE_EVERY;
    G.dropI = 0;
    G.why = '';
    G.bossIn = false;
    autoTx = G.px;
    autoTy = G.py;
    autoStickS = -1e9;
    autoOvWait = 0;
    autoGate = null;
    if (autoOn) G.fireHold = true;
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedDecor();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isRed() ? '红海 · 更密更快' : '远征 · 区 A 骨礁', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    G.zone = 'A';
    G.path = ['A'];
    G.lives = LIVES;
    G.armor = ARMOR;
    G.bombs = 3;
    G.wpnLv = 0;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.bossIn = false;
    G.fork = false;
    G.px = 90;
    G.py = VH * 0.5;
    autoOvWait = 0;
    autoGate = null;
    autoTx = G.px;
    autoTy = G.py;
    clearField();
    seedDecor();
    G.ents.push(makeBoss('shark', '骨鲨', 72));
    G.ents[0].x = VW - 150;
    G.ents[0].y = VH * 0.52;
    showOverlay(
      'title',
      '大流',
      '横向卷轴。银鹰打巨型鱼舰，专打发光弱点。区末飞进上/下航门选路。甲空或撞击扣一命。'
    );
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

  function secondaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('red');
    else if (G.mode === 'lose') goTitle();
    else if (G.mode === 'win') {
      if (isRed()) goTitle();
      else startGame('red');
    }
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    if (k === 'a' || k === 'A' || code === 'KeyA') {
      if (down) {
        e.preventDefault();
        if (!e.repeat) toggleAuto();
      }
      return;
    }
    if (e.target === speedEl) return;
    const isBomb = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z';
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S'
      || k === 'Left' || k === 'Right' || k === 'Up' || k === 'Down';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';

    if (k === 'ArrowLeft' || k === 'Left') {
      keys.l = down && !autoOn;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') {
      keys.r = down && !autoOn;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') {
      keys.u = down && !autoOn;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') {
      keys.d = down && !autoOn;
      if (down) inputSrc = 'key';
    }

    if (down && (isMove || space || isBomb || k === 'Enter')) e.preventDefault();

    if (!down) {
      if (space && !autoOn) G.fireHold = false;
      return;
    }
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (autoOn && (isMove || space || isBomb || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S')) {
      return;
    }
    if (k === '1') {
      if (overlayOpen()) primaryAction();
      return;
    }
    if (k === '2') {
      if (overlayOpen()) secondaryAction();
      return;
    }
    if (isBomb) {
      if (!e.repeat) tryBomb();
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        if (space && G.mode === 'play' && !autoOn) G.fireHold = true;
        return;
      }
      if (G.mode === 'play' && !autoOn) {
        G.fireHold = true;
        fire();
      }
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      if (autoOn) return;
      e.preventDefault();
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      const w = pointerWorld(e);
      pointer.x = w.x;
      pointer.y = w.y;
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      if (autoOn) return;
      const w = pointerWorld(e);
      pointer.x = w.x;
      pointer.y = w.y;
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down || e.pointerType === 'mouse') inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
      if (autoOn) return;
      G.fireHold = false;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () {
      pointer.hover = false;
      if (!pointer.down) G.fireHold = false;
    });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    canvas.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
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

  if (btnRaid) {
    btnRaid.addEventListener('click', function () {
      audio.ensure();
      startGame('raid');
    });
  }
  if (btnRed) {
    btnRed.addEventListener('click', function () {
      audio.ensure();
      startGame('red');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind);
    });
  }
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'win' && !isRed()) startGame('red');
      else goTitle();
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnBomb) btnBomb.addEventListener('click', tryBomb);
  if (btnPad) btnPad.addEventListener('click', tryBomb);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }
  if (btnAuto) btnAuto.addEventListener('click', function () { toggleAuto(); });
  if (speedEl) {
    speedEl.addEventListener('input', function () {
      setAutoSpeed(parseInt(speedEl.value, 10) || 3);
    });
    speedEl.addEventListener('change', function () {
      setAutoSpeed(parseInt(speedEl.value, 10) || 3);
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
      if (!autoOn) G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
