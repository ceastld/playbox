'use strict';

/* 冥界 — Netherworld remake. Free-fly demon, spit fire, smash statues for gems. Optional autoplay. No CDN. */

(function () {
  var WORLD_W = 640;
  var WORLD_H = 400;
  var LIVES = 3;
  var STEP = 1 / 60;
  var TAU = Math.PI * 2;
  var P_R = 10;
  var ACCEL = 680;
  var MAX_V = 198;
  var DRAG = 4.6;
  var SPIT_CD = 0.15;
  var SPIT_SPD = 328;
  var SPIT_MAX = 3;
  var SPIT_LIFE = 0.92;
  var SPIT_R = 5.2;
  var GEM_R = 6.2;
  var COMBO_WIN = 1.42;
  var INVULN = 1.58;
  var DIE_T = 0.72;
  var MAGNET = 38;
  var EXIT_R = 18;
  var BEST_KEY = 'playbox-netherworld-best';
  var MUTE_KEY = 'playbox-netherworld-mute';
  var AUTO_SPEED_KEY = 'playbox-netherworld-auto-speed';
  var SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  var AUTO_SCALE = [1, 0.5, 0.75, 1, 3.4];
  var CELL = 16;
  var GW = 40;
  var GH = 25;
  var OPS = '←↑↓→ / WSD 飞 · 空格吐火 · A 自动 · R 重开 · M 静音';

  var MAG = [255, 61, 184];
  var CYN = [0, 240, 255];
  var GOLD = [255, 227, 107];
  var HOT = [196, 77, 255];
  var FIRE = [255, 122, 40];
  var FIRE2 = [255, 210, 80];
  var WHT = [246, 238, 255];
  var STONE = [92, 68, 118];
  var STONE2 = [168, 128, 196];

  var hasDom = typeof document !== 'undefined';
  var REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

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
  function R(x, y, w, h) {
    return { x: x, y: y, w: w, h: h };
  }
  function S(x, y, kind) {
    return { x: x, y: y, kind: kind || 'face' };
  }
  function E(kind, x, y) {
    return { kind: kind, x: x, y: y };
  }
  function comboMul(n) {
    return 1 + Math.min(4, Math.max(0, (n | 0) - 1));
  }
  function gemDrop(kind) {
    return kind === 'face' ? 2 : 1;
  }
  function kindScore(kind) {
    if (kind === 'imp') return 160;
    if (kind === 'bat') return 200;
    if (kind === 'skull') return 260;
    return 100;
  }
  function kindRgb(kind) {
    if (kind === 'imp') return FIRE;
    if (kind === 'bat') return HOT;
    if (kind === 'skull') return MAG;
    return WHT;
  }
  function kindSpd(kind, dense) {
    var s = kind === 'imp' ? 78 : kind === 'bat' ? 96 : 62;
    return dense ? s * 1.24 : s;
  }
  function circleRect(cx, cy, r, rec) {
    var nx = clamp(cx, rec.x, rec.x + rec.w);
    var ny = clamp(cy, rec.y, rec.y + rec.h);
    var dx = cx - nx;
    var dy = cy - ny;
    return dx * dx + dy * dy < r * r;
  }
  function circleHit(cx, cy, r, list) {
    var i;
    for (i = 0; i < list.length; i++) {
      if (circleRect(cx, cy, r, list[i])) return list[i];
    }
    return null;
  }
  function statueBox(s) {
    return { x: s.x - 14, y: s.y - 17, w: 28, h: 34 };
  }

  var BORDER = [
    R(0, 0, 640, 18),
    R(0, 382, 640, 18),
    R(0, 0, 18, 400),
    R(622, 0, 18, 400)
  ];

  var ROOMS = [
    {
      name: '初窟',
      walls: [R(150, 176, 72, 16), R(418, 210, 72, 16)],
      statues: [
        S(96, 78), S(220, 86), S(360, 72), S(530, 90),
        S(118, 308, 'time'), S(286, 286), S(448, 312), S(552, 268)
      ],
      enemies: [E('imp', 400, 120), E('imp', 220, 250)],
      spawn: { x: 58, y: 200 },
      exit: { x: 568, y: 196 }
    },
    {
      name: '双厅',
      walls: [R(308, 18, 22, 148), R(308, 236, 22, 146), R(90, 188, 56, 16), R(494, 188, 56, 16)],
      statues: [
        S(86, 70), S(200, 78), S(86, 320), S(210, 310),
        S(430, 74), S(546, 86, 'time'), S(430, 318), S(548, 300)
      ],
      enemies: [E('imp', 140, 140), E('imp', 500, 260), E('bat', 480, 120)],
      spawn: { x: 58, y: 200 },
      exit: { x: 574, y: 200 }
    },
    {
      name: '十字',
      walls: [R(300, 18, 20, 128), R(300, 254, 20, 128), R(18, 190, 220, 18), R(402, 190, 220, 18)],
      statues: [
        S(90, 70), S(210, 80), S(90, 310), S(220, 318),
        S(430, 72, 'time'), S(540, 88), S(430, 312), S(548, 300),
        S(160, 140), S(480, 260)
      ],
      enemies: [E('skull', 480, 90), E('bat', 120, 300), E('imp', 520, 300)],
      spawn: { x: 58, y: 80 },
      exit: { x: 574, y: 320 }
    },
    {
      name: '石阵',
      walls: [R(200, 110, 16, 70), R(424, 220, 16, 70)],
      statues: [
        S(140, 80), S(250, 80), S(360, 80), S(500, 80),
        S(140, 200, 'time'), S(250, 200), S(390, 200), S(500, 200),
        S(140, 318), S(250, 318), S(360, 318), S(500, 318, 'heart')
      ],
      enemies: [E('imp', 320, 140), E('bat', 180, 260), E('skull', 520, 140)],
      spawn: { x: 56, y: 200 },
      exit: { x: 576, y: 200 }
    },
    {
      name: '裂廊',
      walls: [R(80, 132, 480, 16), R(80, 252, 480, 16), R(300, 148, 18, 104)],
      statues: [
        S(90, 70), S(230, 64), S(400, 70), S(540, 64, 'time'),
        S(90, 192), S(200, 192), S(440, 192), S(550, 192),
        S(90, 328), S(240, 332), S(400, 328), S(540, 332)
      ],
      enemies: [E('bat', 180, 70), E('bat', 480, 330), E('imp', 160, 192), E('skull', 500, 192)],
      spawn: { x: 56, y: 70 },
      exit: { x: 576, y: 330 }
    },
    {
      name: '深柱',
      walls: [
        R(130, 70, 36, 70), R(130, 260, 36, 70),
        R(300, 140, 40, 40), R(470, 70, 36, 70), R(470, 260, 36, 70)
      ],
      statues: [
        S(80, 80), S(230, 80), S(400, 64), S(560, 80),
        S(80, 200, 'time'), S(230, 210), S(410, 210), S(560, 200),
        S(80, 328), S(230, 328, 'heart'), S(400, 332), S(560, 328)
      ],
      enemies: [E('skull', 360, 80), E('imp', 200, 300), E('bat', 540, 200), E('imp', 80, 140)],
      spawn: { x: 56, y: 200 },
      exit: { x: 576, y: 200 }
    },
    {
      name: '环心',
      walls: [
        R(200, 110, 240, 16), R(200, 274, 240, 16),
        R(200, 126, 16, 42), R(200, 220, 16, 54), R(424, 126, 16, 148)
      ],
      statues: [
        S(80, 70), S(320, 64), S(560, 70),
        S(80, 200, 'time'), S(260, 200), S(380, 200), S(560, 200),
        S(80, 330), S(320, 336, 'heart'), S(560, 330),
        S(140, 140), S(500, 260)
      ],
      enemies: [E('skull', 320, 200), E('bat', 80, 140), E('bat', 560, 260), E('imp', 140, 320)],
      spawn: { x: 56, y: 70 },
      exit: { x: 320, y: 200 }
    },
    {
      name: '终殿',
      walls: [
        R(150, 90, 18, 90), R(150, 230, 18, 90),
        R(310, 50, 20, 90), R(310, 260, 20, 90),
        R(470, 90, 18, 90), R(470, 230, 18, 90)
      ],
      statues: [
        S(80, 70), S(230, 64), S(400, 64), S(560, 70),
        S(80, 200, 'time'), S(230, 200), S(400, 200), S(560, 200, 'heart'),
        S(80, 332), S(230, 332), S(400, 332), S(560, 332),
        S(160, 140), S(480, 270)
      ],
      enemies: [
        E('skull', 240, 120), E('skull', 500, 280),
        E('bat', 80, 140), E('bat', 560, 80),
        E('imp', 80, 300), E('imp', 400, 80)
      ],
      spawn: { x: 56, y: 200 },
      exit: { x: 576, y: 200 }
    }
  ];

  function solidsOf(walls, statues) {
    var out = walls.slice();
    var i;
    for (i = 0; i < statues.length; i++) {
      if (statues[i].alive) out.push(statueBox(statues[i]));
    }
    return out;
  }

  function roomGemTotal(def) {
    var n = 0;
    var i;
    for (i = 0; i < def.statues.length; i++) n += gemDrop(def.statues[i].kind);
    return n;
  }

  function pointClear(x, y, r, walls) {
    return !circleHit(x, y, r, walls);
  }

  function selfCheck() {
    var i, d, walls, tot, q;
    if (comboMul(1) !== 1) throw new Error('combo 1');
    if (comboMul(2) !== 2) throw new Error('combo 2');
    if (comboMul(5) !== 5) throw new Error('combo 5');
    if (comboMul(9) !== 5) throw new Error('combo cap');
    if (gemDrop('face') !== 2) throw new Error('face gems');
    if (gemDrop('time') !== 1) throw new Error('time gems');
    if (!circleRect(10, 10, 6, R(12, 8, 20, 20))) throw new Error('circleRect hit');
    if (circleRect(0, 0, 4, R(20, 20, 10, 10))) throw new Error('circleRect miss');
    if (ROOMS.length !== 8) throw new Error('8 rooms');
    for (i = 0; i < ROOMS.length; i++) {
      d = ROOMS[i];
      walls = BORDER.concat(d.walls);
      if (!pointClear(d.spawn.x, d.spawn.y, P_R, walls)) throw new Error('spawn wall ' + d.name);
      if (!pointClear(d.exit.x, d.exit.y, 8, walls)) throw new Error('exit wall ' + d.name);
      tot = roomGemTotal(d);
      q = Math.max(3, Math.ceil(tot * 0.62));
      if (q > tot) throw new Error('quota ' + d.name);
      if (d.statues.length < 6) throw new Error('statues ' + d.name);
    }
    if (!pointClear(208, 190, 10, BORDER.concat(ROOMS[6].walls))) throw new Error('ring gap');
    return true;
  }

  if (!hasDom) {
    selfCheck();
    return;
  }

  selfCheck();

  var audio = {
    ctx: null,
    master: null,
    muted: false,
    ensure: function () {
      if (!this.ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.34;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.34;
      if (btnMute) {
        btnMute.textContent = m ? '静' : '声';
        btnMute.classList.toggle('muted', m);
        btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      }
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (e) { /* ignore */ }
    },
    beep: function (freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted) return;
      var t = this.ctx.currentTime;
      var o = this.ctx.createOscillator();
      var g = this.ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(Math.max(0.0001, vol), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.03);
    },
    noise: function (dur, vol, hp) {
      if (!this.ctx || this.muted) return;
      var n = Math.max(0.04, dur);
      var sr = this.ctx.sampleRate;
      var buf = this.ctx.createBuffer(1, Math.max(1, (sr * n) | 0), sr);
      var data = buf.getChannelData(0);
      var i;
      for (i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      var src = this.ctx.createBufferSource();
      src.buffer = buf;
      var f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = hp || 700;
      var g = this.ctx.createGain();
      var t = this.ctx.currentTime;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.02);
    },
    spit: function () {
      this.ensure();
      this.beep(320, 0.07, 'sawtooth', 0.05, 140);
      this.beep(880, 0.05, 'square', 0.028, 240);
    },
    chip: function () {
      this.ensure();
      this.noise(0.05, 0.04, 500);
      this.beep(180, 0.06, 'triangle', 0.03, 80);
    },
    boom: function () {
      this.ensure();
      this.noise(0.14, 0.07, 220);
      this.beep(140, 0.16, 'sawtooth', 0.055, 48);
    },
    gem: function (n) {
      this.ensure();
      var f = 620 + Math.min(10, n) * 78;
      this.beep(f, 0.08, 'sine', 0.045, f * 1.55);
      this.beep(f * 1.5, 0.06, 'triangle', 0.028);
    },
    kill: function () {
      this.ensure();
      this.noise(0.1, 0.05, 360);
      this.beep(420, 0.1, 'square', 0.04, 110);
    },
    open: function () {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.04, 1175);
    },
    exit: function () {
      this.ensure();
      this.beep(523, 0.08, 'sine', 0.045);
      this.beep(659, 0.1, 'sine', 0.04);
      this.beep(784, 0.16, 'triangle', 0.045, 1240);
    },
    time: function () {
      this.ensure();
      this.beep(880, 0.07, 'sine', 0.04, 1320);
    },
    heart: function () {
      this.ensure();
      this.beep(660, 0.08, 'sine', 0.04);
      this.beep(880, 0.12, 'triangle', 0.04);
    },
    tick: function () {
      this.ensure();
      this.beep(880, 0.04, 'square', 0.03, 440);
    },
    wall: function () {
      this.ensure();
      this.noise(0.04, 0.025, 900);
      this.beep(240, 0.04, 'triangle', 0.018, 90);
    },
    hurt: function () {
      this.ensure();
      this.beep(160, 0.18, 'sawtooth', 0.06, 60);
      this.noise(0.14, 0.055, 300);
    },
    win: function () {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.05);
      this.beep(659, 0.12, 'sine', 0.045);
      this.beep(784, 0.16, 'sine', 0.05);
      this.beep(1046, 0.28, 'triangle', 0.05, 1560);
    },
    lose: function () {
      this.ensure();
      this.beep(220, 0.2, 'sawtooth', 0.05, 80);
      this.beep(120, 0.32, 'sine', 0.055, 46);
    },
    start: function () {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 784);
    }
  };

  function el(id) {
    return document.getElementById(id);
  }

  var canvas = el('c');
  var ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;
  var overlay = el('overlay');
  var panel = el('panel');
  var ovKicker = el('ov-kicker');
  var ovTitle = el('ov-title');
  var ovLead = el('ov-lead');
  var ovOps = el('ov-ops');
  var ovStart = el('ov-start');
  var ovEnd = el('ov-end');
  var btnQuarry = el('btn-quarry');
  var btnTide = el('btn-tide');
  var ovRetry = el('ov-retry');
  var ovMenu = el('ov-menu');
  var btnMute = el('btn-mute');
  var btnRetry = el('btn-retry');
  var btnAuto = el('btn-auto');
  var speedEl = el('speed');
  var speedLab = el('speed-lab');
  var scoreEl = el('score');
  var bestEl = el('best');
  var scoreBox = el('score-box');
  var scoreAdd = el('score-add');
  var comboEl = el('combo');
  var comboBox = el('combo-box');
  var comboLabel = el('combo-label');
  var roomLabel = el('room-label');
  var modeLabel = el('mode-label');
  var gemLabel = el('gem-label');
  var timeWrap = el('time-wrap');
  var timeBar = el('time-bar');
  var pipsEl = el('pips');
  var toastEl = el('toast');
  var hintEl = el('hint');
  var stageEl = el('stage');
  var padEl = el('pad');
  var padBtns = {
    up: el('btn-up'),
    down: el('btn-down'),
    left: el('btn-left'),
    right: el('btn-right'),
    spit: el('btn-spit')
  };

  var W = 1;
  var H = 1;
  var dpr = 1;
  var scale = 1;
  var ox = 0;
  var oy = 0;
  var hidden = false;
  var toastT = 0;
  var lastAddT = 0;

  var keys = { u: false, d: false, l: false, r: false, spit: false };
  var spitEdge = false;
  var ptr = { down: false, id: 0, x: 0, y: 0, sx: 0, sy: 0, drag: false, ax: 0, ay: 0 };
  var particles = [];
  var pops = [];
  var rings = [];
  var motes = [];

  var G = {
    phase: 'title',
    mode: 'quarry',
    lastMode: 'quarry',
    room: 0,
    rooms: 6,
    score: 0,
    best: 0,
    lives: LIVES,
    combo: 0,
    comboT: 0,
    time: 56,
    timeMax: 56,
    dense: false,
    quota: 0,
    got: 0,
    exitOn: false,
    why: '',
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: MAG,
    inv: 0,
    dead: false,
    deadT: 0,
    spitCd: 0,
    tickT: 0,
    wallT: 0,
    sq: 1,
    name: '',
    p: null,
    walls: [],
    statues: [],
    enemies: [],
    shots: [],
    gems: [],
    spawn: { x: 58, y: 200 },
    exit: { x: 568, y: 196 }
  };

  var autoOn = false;
  var autoSpeed = 3;
  var autoOvWait = 0;
  var autoMX = 0;
  var autoMY = 0;
  var autoAimX = 0;
  var autoAimY = 0;
  var autoLastX = 0;
  var autoLastY = 0;
  var autoStuck = 0;
  var autoWpX = 0;
  var autoWpY = 0;
  var autoIgnoreGem = 0;
  var autoGot = 0;
  var autoGemN = 0;
  var autoSeen = [];
  var autoQx = [];
  var autoQy = [];
  var autoCame = [];

  function loadBest() {
    try {
      var n = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
      G.best = isFinite(n) && n > 0 ? n : 0;
    } catch (e) {
      G.best = 0;
    }
    if (bestEl) bestEl.textContent = String(G.best);
  }

  function saveBest() {
    if (G.score > G.best) {
      G.best = G.score;
      try { localStorage.setItem(BEST_KEY, String(G.best)); } catch (e) { /* ignore */ }
      if (bestEl) bestEl.textContent = String(G.best);
    }
  }

  function loadAutoSpeed() {
    try {
      var n = parseInt(localStorage.getItem(AUTO_SPEED_KEY) || '3', 10);
      if (!isFinite(n) || n < 1 || n > 4) return 3;
      return n;
    } catch (e) {
      return 3;
    }
  }

  function saveAutoSpeed(n) {
    try { localStorage.setItem(AUTO_SPEED_KEY, String(n)); } catch (e) { /* ignore */ }
  }

  function kick(cls) {
    if (!stageEl || REDUCE) return;
    stageEl.classList.remove(cls);
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
  }

  function hitStop(sec) {
    if (REDUCE) return;
    G.stop = Math.max(G.stop, sec);
  }

  function shake(n) {
    if (REDUCE) return;
    G.shake = Math.max(G.shake, n);
  }

  function flash(rgb, a) {
    G.flash = a;
    G.flashRgb = rgb;
  }

  function emit(n, spec) {
    if (REDUCE) n = Math.min(n, 7);
    if (particles.length > 160) n = Math.min(n, 5);
    var i;
    for (i = 0; i < n; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        t: spec.life,
        life: spec.life,
        r: rand(spec.r0, spec.r1),
        rgb: spec.rgb,
        g: spec.g || 0
      });
    }
  }

  function spawnPop(x, y, text, rgb) {
    pops.push({ x: x, y: y, text: text, rgb: rgb, t: 0.82, life: 0.82 });
  }

  function spawnRing(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb });
  }

  function toast(msg, kind) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden', 'warn', 'gold');
    if (kind) toastEl.classList.add(kind);
    toastT = 1.15;
  }

  function setHint(s, kind) {
    if (!hintEl) return;
    hintEl.textContent = s;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.classList.remove('end');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function showOverlay(kind) {
    if (!overlay || !panel) return;
    overlay.classList.remove('hidden');
    overlay.classList.toggle('end', kind !== 'title');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (kind === 'title') {
      if (ovKicker) ovKicker.textContent = 'NETH';
      if (ovTitle) ovTitle.textContent = '冥界';
      if (ovLead) ovLead.textContent = '飞魔吐火，砸石像收宝石。收够出口开，飞进去进下一间。时间耗尽或撞敌扣命。';
      if (ovOps) ovOps.textContent = OPS;
    } else if (kind === 'win') {
      if (ovKicker) ovKicker.textContent = 'CLEAR';
      if (ovTitle) ovTitle.textContent = G.mode === 'tide' ? '魔潮退了' : '矿脉掏空';
      if (ovLead) ovLead.textContent = '分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '');
      if (ovOps) ovOps.textContent = 'R 重开随时可用';
    } else {
      if (ovKicker) ovKicker.textContent = 'DOWN';
      if (ovTitle) ovTitle.textContent = G.why || '命尽';
      if (ovLead) ovLead.textContent = '打到第 ' + (G.room + 1) + ' 间。分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '');
      if (ovOps) ovOps.textContent = 'R 重开随时可用';
    }
  }

  function addScore(n, x, y, rgb) {
    var v = n | 0;
    if (v <= 0) return;
    G.score += v;
    saveBest();
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    if (scoreAdd) {
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + v;
      lastAddT = 0.7;
    }
    if (x != null) spawnPop(x, y - 12, '+' + v, rgb || GOLD);
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    if (comboEl) comboEl.textContent = '×' + comboMul(G.combo);
    if (comboBox) {
      comboBox.classList.toggle('hot', G.combo > 1);
      comboBox.classList.remove('flash');
      void comboBox.offsetWidth;
      if (G.combo > 1) comboBox.classList.add('flash');
    }
    if (comboLabel) {
      comboLabel.hidden = G.combo < 2;
      comboLabel.textContent = '连击 ×' + comboMul(G.combo);
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (comboEl) comboEl.textContent = '×' + comboMul(Math.max(1, G.combo));
    if (comboLabel) comboLabel.hidden = G.combo < 2;
    if (roomLabel) roomLabel.textContent = G.phase === 'title' ? '冥窟' : ('第 ' + (G.room + 1) + ' 间');
    if (modeLabel) {
      modeLabel.textContent = G.mode === 'tide' ? '魔潮' : '采石';
      modeLabel.classList.toggle('tide', G.mode === 'tide');
    }
    if (gemLabel) gemLabel.textContent = '晶 ' + G.got + '/' + G.quota;
    if (timeBar) {
      var t = G.timeMax > 0 ? clamp(G.time / G.timeMax, 0, 1) : 0;
      timeBar.style.transform = 'scaleX(' + t + ')';
    }
    if (timeWrap) timeWrap.classList.toggle('warn', G.phase === 'play' && G.time < 10);
    if (pipsEl) {
      var n = Math.max(3, G.lives);
      var html = '';
      var i;
      for (i = 0; i < n; i++) {
        html += '<i class="pip' + (i < G.lives ? ' on' : ' gone') + '"></i>';
      }
      pipsEl.innerHTML = html;
    }
  }

  function makePlayer(x, y) {
    return {
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      r: P_R,
      fx: 1,
      fy: 0,
      flap: 0,
      spitFlash: 0
    };
  }

  function extraStatues(def, dense) {
    if (!dense) return [];
    var extra = [];
    var i, s;
    for (i = 0; i < def.statues.length; i += 4) {
      s = def.statues[i];
      extra.push(S(clamp(s.x + 46, 50, 590), clamp(s.y + 36, 50, 350), 'face'));
    }
    return extra;
  }

  function extraEnemies(def, dense) {
    if (!dense) return [];
    var extra = [];
    var i, e;
    for (i = 0; i < def.enemies.length; i += 2) {
      e = def.enemies[i];
      extra.push(E(e.kind === 'imp' ? 'bat' : 'imp', clamp(e.x + 40, 60, 580), clamp(e.y - 30, 60, 340)));
    }
    return extra;
  }

  function makeStatue(s, hp) {
    return {
      x: s.x,
      y: s.y,
      kind: s.kind,
      hp: hp,
      max: hp,
      alive: true,
      flash: 0,
      wob: rand(0, TAU)
    };
  }

  function makeEnemy(e, dense) {
    var spd = kindSpd(e.kind, dense);
    var ang = rand(0, TAU);
    return {
      kind: e.kind,
      x: e.x,
      y: e.y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      baseY: e.y,
      r: e.kind === 'bat' ? 9 : 10,
      t: rand(0, TAU),
      spd: spd,
      alive: true
    };
  }

  function unstuck(o, solids) {
    if (!circleHit(o.x, o.y, o.r, solids)) return;
    var d, k, nx, ny, dist;
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
    for (dist = 4; dist <= 48; dist += 4) {
      for (k = 0; k < dirs.length; k++) {
        d = dirs[k];
        nx = o.x + d[0] * dist;
        ny = o.y + d[1] * dist;
        if (nx < 28 || ny < 28 || nx > WORLD_W - 28 || ny > WORLD_H - 28) continue;
        if (!circleHit(nx, ny, o.r, solids)) {
          o.x = nx;
          o.y = ny;
          return;
        }
      }
    }
  }

  function loadRoom(index) {
    var def = ROOMS[index % ROOMS.length];
    var dense = G.dense;
    var hp = dense ? 3 : 2;
    var walls = BORDER.concat(def.walls);
    var statues = [];
    var enemies = [];
    var list, i, j, s, tot, blocked;
    list = def.statues.concat(extraStatues(def, dense));
    for (i = 0; i < list.length; i++) {
      s = list[i];
      if (circleHit(s.x, s.y, 16, walls)) continue;
      if (hypot(s.x - def.spawn.x, s.y - def.spawn.y) < 36) continue;
      if (hypot(s.x - def.exit.x, s.y - def.exit.y) < 30) continue;
      blocked = false;
      for (j = 0; j < statues.length; j++) {
        if (hypot(s.x - statues[j].x, s.y - statues[j].y) < 32) { blocked = true; break; }
      }
      if (blocked) continue;
      statues.push(makeStatue(s, hp));
    }
    list = def.enemies.concat(extraEnemies(def, dense));
    for (i = 0; i < list.length; i++) {
      if (circleHit(list[i].x, list[i].y, 12, walls)) continue;
      enemies.push(makeEnemy(list[i], dense));
    }
    G.walls = walls;
    G.statues = statues;
    G.enemies = enemies;
    G.shots = [];
    G.gems = [];
    G.spawn = { x: def.spawn.x, y: def.spawn.y };
    G.exit = { x: def.exit.x, y: def.exit.y };
    G.name = def.name;
    G.got = 0;
    tot = 0;
    for (i = 0; i < statues.length; i++) tot += gemDrop(statues[i].kind);
    G.quota = Math.min(tot, Math.max(3, Math.ceil(tot * (dense ? 0.7 : 0.6))));
    G.exitOn = false;
    G.p = makePlayer(def.spawn.x, def.spawn.y);
    autoLastX = G.p.x;
    autoLastY = G.p.y;
    autoStuck = 0;
    autoMX = 0;
    autoMY = 0;
    autoIgnoreGem = 0;
    autoGot = 0;
    autoGemN = 0;
    G.inv = 0.85;
    G.dead = false;
    G.deadT = 0;
    G.spitCd = 0;
    G.sq = 1;
    unstuck(G.p, solidsOf(G.walls, G.statues));
    toast(def.name, 'gold');
    setHint(dense ? '魔潮更密 · 吐火砸像 · 收晶进出口' : '吐火砸石像 · 宝石收够出口开 · 撞墙不疼，撞敌扣命');
  }

  function startRun(mode) {
    G.mode = mode;
    G.lastMode = mode;
    G.dense = mode === 'tide';
    G.rooms = mode === 'tide' ? 8 : 6;
    G.phase = 'play';
    G.room = 0;
    G.score = 0;
    G.lives = LIVES;
    G.combo = 0;
    G.comboT = 0;
    G.why = '';
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    particles.length = 0;
    pops.length = 0;
    rings.length = 0;
    var tmax = G.dense ? 44 : 56;
    G.timeMax = tmax;
    G.time = tmax;
    autoOvWait = 0;
    loadRoom(0);
    hideOverlay();
    audio.start();
    syncHud();
    if (canvas) canvas.focus();
  }

  function nextRoom() {
    var bonus = 420 + 70 * G.room + Math.floor(G.time * 10);
    addScore(bonus, G.p.x, G.p.y, CYN);
    G.room += 1;
    if (G.room >= G.rooms) {
      winGame();
      return;
    }
    G.time = Math.min(G.timeMax, G.time + (G.dense ? 10 : 14));
    G.comboT = Math.max(G.comboT, 0.4);
    loadRoom(G.room);
    audio.exit();
    flash(CYN, 0.28);
    syncHud();
  }

  function winGame() {
    G.phase = 'win';
    saveBest();
    showOverlay('win');
    audio.win();
    setHint((G.mode === 'tide' ? '魔潮退了' : '矿脉掏空') + ' · R 再来', 'hot');
    syncHud();
  }

  function loseGame(why) {
    G.phase = 'lose';
    G.why = why || '命尽';
    saveBest();
    showOverlay('lose');
    audio.lose();
    setHint('命尽 · R 重开', 'warn');
    syncHud();
  }

  function killPlayer(why) {
    if (G.dead || G.inv > 0 || G.phase !== 'play') return;
    G.dead = true;
    G.deadT = DIE_T;
    G.why = why;
    G.lives -= 1;
    audio.hurt();
    kick('die');
    shake(10);
    hitStop(0.08);
    flash(MAG, 0.42);
    emit(28, {
      x: G.p.x, y: G.p.y, j: 8,
      vx0: -180, vx1: 180, vy0: -200, vy1: 80,
      life: 0.5, r0: 1.5, r1: 4.2, rgb: MAG, g: 80
    });
    syncHud();
  }

  function respawn() {
    if (G.lives <= 0) {
      loseGame(G.why || '命尽');
      return;
    }
    G.dead = false;
    G.p.x = G.spawn.x;
    G.p.y = G.spawn.y;
    G.p.vx = 0;
    G.p.vy = 0;
    G.inv = INVULN;
    if (G.time < 16) G.time = 16;
    unstuck(G.p, solidsOf(G.walls, G.statues));
    toast(G.why === '时尽' ? '时尽 · 续飞' : '再起', 'warn');
  }

  function openExit() {
    if (G.exitOn) return;
    G.exitOn = true;
    audio.open();
    spawnRing(G.exit.x, G.exit.y, CYN);
    toast('出口开了', 'gold');
    setHint('出口已开 · 飞进去', 'hot');
    flash(GOLD, 0.2);
  }

  function spawnGems(st) {
    var n = gemDrop(st.kind);
    var i, ang, spd;
    for (i = 0; i < n; i++) {
      ang = rand(0, TAU);
      spd = rand(70, 160);
      G.gems.push({
        x: st.x,
        y: st.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: GEM_R,
        t: rand(0, TAU),
        life: 99
      });
    }
  }

  function breakStatue(st) {
    st.alive = false;
    bumpCombo();
    addScore(140 * comboMul(G.combo), st.x, st.y, STONE2);
    audio.boom();
    hitStop(0.07);
    shake(7);
    kick('hit');
    flash(FIRE2, 0.16);
    spawnRing(st.x, st.y, GOLD);
    emit(26, {
      x: st.x, y: st.y, j: 10,
      vx0: -220, vx1: 220, vy0: -240, vy1: 60,
      life: 0.55, r0: 1.4, r1: 4.6, rgb: STONE2, g: 140
    });
    emit(10, {
      x: st.x, y: st.y, j: 6,
      vx0: -80, vx1: 80, vy0: -90, vy1: 40,
      life: 0.4, r0: 1, r1: 2.4, rgb: GOLD, g: 20
    });
    spawnGems(st);
    if (st.kind === 'time') {
      G.time = Math.min(G.timeMax + 8, G.time + 8);
      audio.time();
      spawnPop(st.x, st.y - 22, '+8 时', CYN);
      toast('加时', 'gold');
    }
    if (st.kind === 'heart') {
      if (G.lives < 5) {
        G.lives += 1;
        audio.heart();
        spawnPop(st.x, st.y - 22, '命 +1', MAG);
        toast('加命', 'warn');
        syncHud();
      }
    }
  }

  function chipStatue(st, hx, hy) {
    st.hp -= 1;
    st.flash = 0.12;
    audio.chip();
    hitStop(0.045);
    shake(3);
    emit(8, {
      x: hx, y: hy, j: 4,
      vx0: -90, vx1: 90, vy0: -120, vy1: 20,
      life: 0.28, r0: 1, r1: 2.6, rgb: STONE2, g: 40
    });
    if (st.hp <= 0) breakStatue(st);
  }

  function killEnemy(en) {
    en.alive = false;
    bumpCombo();
    addScore(kindScore(en.kind) * comboMul(G.combo), en.x, en.y, kindRgb(en.kind));
    audio.kill();
    hitStop(0.055);
    shake(5);
    spawnRing(en.x, en.y, kindRgb(en.kind));
    emit(18, {
      x: en.x, y: en.y, j: 7,
      vx0: -200, vx1: 200, vy0: -210, vy1: 70,
      life: 0.42, r0: 1.2, r1: 3.6, rgb: kindRgb(en.kind), g: 60
    });
  }

  function collectGem(g) {
    var i = G.gems.indexOf(g);
    if (i >= 0) G.gems.splice(i, 1);
    G.got += 1;
    bumpCombo();
    addScore(90 * comboMul(G.combo), g.x, g.y, GOLD);
    audio.gem(G.combo);
    hitStop(0.032);
    emit(12, {
      x: g.x, y: g.y, j: 4,
      vx0: -70, vx1: 70, vy0: -110, vy1: -10,
      life: 0.38, r0: 1, r1: 2.8, rgb: GOLD, g: 10
    });
    spawnRing(g.x, g.y, GOLD);
    if (G.got >= G.quota) openExit();
    syncHud();
  }

  function spitFire() {
    if (G.phase !== 'play' || G.dead) return;
    if (G.spitCd > 0) return;
    if (G.shots.length >= SPIT_MAX) return;
    var p = G.p;
    var fx = p.fx;
    var fy = p.fy;
    var len = hypot(fx, fy) || 1;
    fx /= len;
    fy /= len;
    G.shots.push({
      x: p.x + fx * 16,
      y: p.y + fy * 16,
      vx: fx * SPIT_SPD + p.vx * 0.2,
      vy: fy * SPIT_SPD + p.vy * 0.2,
      r: SPIT_R,
      life: SPIT_LIFE
    });
    G.spitCd = SPIT_CD;
    p.spitFlash = 0.12;
    audio.spit();
    emit(6, {
      x: p.x + fx * 14, y: p.y + fy * 14, j: 2,
      vx0: fx * 40, vx1: fx * 160, vy0: fy * 40, vy1: fy * 160,
      life: 0.18, r0: 1.2, r1: 2.8, rgb: FIRE, g: 0
    });
  }

  function cellOf(x, y) {
    return {
      cx: clamp((x / CELL) | 0, 0, GW - 1),
      cy: clamp((y / CELL) | 0, 0, GH - 1)
    };
  }

  function cellCenter(cx, cy) {
    return { x: cx * CELL + CELL * 0.5, y: cy * CELL + CELL * 0.5 };
  }

  function walkAt(x, y, solids) {
    if (x < 24 || y < 24 || x > WORLD_W - 24 || y > WORLD_H - 24) return false;
    return !circleHit(x, y, P_R + 1, solids);
  }

  function nearestWalk(x, y, solids) {
    if (walkAt(x, y, solids)) return { x: x, y: y };
    var d, k, ang, nx, ny;
    for (d = 8; d <= 64; d += 8) {
      for (k = 0; k < 16; k++) {
        ang = (k / 16) * TAU;
        nx = x + Math.cos(ang) * d;
        ny = y + Math.sin(ang) * d;
        if (walkAt(nx, ny, solids)) return { x: nx, y: ny };
      }
    }
    return { x: x, y: y };
  }

  function wallShot(x0, y0, x1, y1) {
    var dx = x1 - x0;
    var dy = y1 - y0;
    var d = hypot(dx, dy);
    if (d < 8) return false;
    var steps = Math.max(5, (d / 12) | 0);
    var i, x, y;
    for (i = 1; i < steps; i++) {
      x = x0 + dx * i / steps;
      y = y0 + dy * i / steps;
      if (circleHit(x, y, 4, G.walls)) return true;
    }
    return false;
  }

  function pathWaypoint(px, py, gx, gy, solids) {
    var s = cellOf(px, py);
    var g = cellOf(gx, gy);
    var n = GW * GH;
    var i, qh, qt, cx, cy, nx, ny, k, id, nid, look, pt, startId, found, step;
    var chain = [];
    var dirs = [
      [1, 0], [-1, 0], [0, 1], [0, -1],
      [1, 1], [1, -1], [-1, 1], [-1, -1]
    ];
    if (autoSeen.length !== n) {
      autoSeen = new Array(n);
      autoCame = new Array(n);
    }
    for (i = 0; i < n; i++) autoSeen[i] = 0;
    qh = 0;
    qt = 1;
    autoQx[0] = s.cx;
    autoQy[0] = s.cy;
    startId = s.cy * GW + s.cx;
    autoSeen[startId] = 1;
    autoCame[startId] = -1;
    found = startId;
    while (qh < qt) {
      cx = autoQx[qh];
      cy = autoQy[qh];
      qh += 1;
      id = cy * GW + cx;
      found = id;
      if (cx === g.cx && cy === g.cy) break;
      for (k = 0; k < 8; k++) {
        nx = cx + dirs[k][0];
        ny = cy + dirs[k][1];
        if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
        nid = ny * GW + nx;
        if (autoSeen[nid]) continue;
        pt = cellCenter(nx, ny);
        if (!walkAt(pt.x, pt.y, solids)) continue;
        autoSeen[nid] = 1;
        autoCame[nid] = id;
        autoQx[qt] = nx;
        autoQy[qt] = ny;
        qt += 1;
      }
    }
    id = g.cy * GW + g.cx;
    if (!autoSeen[id]) id = found;
    look = id;
    i = 0;
    while (look >= 0 && i < 80) {
      chain.push(look);
      if (look === startId) break;
      look = autoCame[look];
      i += 1;
    }
    if (chain.length <= 1) return { x: gx, y: gy };
    step = Math.min(5, chain.length - 1);
    look = chain[chain.length - 1 - step];
    return cellCenter(look % GW, (look / GW) | 0);
  }

  function dangerAt(x, y) {
    var i, en, ex, ey, d, rad, n;
    var panic = G.inv > 0.22 ? 0.14 : 1;
    var v = 0;
    for (i = 0; i < G.enemies.length; i++) {
      en = G.enemies[i];
      if (!en.alive) continue;
      ex = en.x + en.vx * 0.16;
      ey = en.y + en.vy * 0.16;
      d = hypot(x - ex, y - ey);
      rad = P_R + en.r;
      n = en.kind === 'skull' ? 1.55 : en.kind === 'bat' ? 1.12 : 1;
      if (d < rad + 8) v += 2400 * n * panic;
      else if (d < rad + 62) v += (rad + 62 - d) * (en.kind === 'skull' ? 16 : 8) * n * panic;
    }
    return v;
  }

  function pickAutoGoal(solids) {
    var p = G.p;
    var i, j, g, st, d, sc, best, bestS, near;
    if (G.exitOn) {
      near = null;
      bestS = 32;
      for (i = 0; i < G.gems.length; i++) {
        g = G.gems[i];
        d = hypot(g.x - p.x, g.y - p.y);
        if (d < bestS) {
          bestS = d;
          near = g;
        }
      }
      if (near) return { x: near.x, y: near.y, kind: 'gem' };
      return { x: G.exit.x, y: G.exit.y, kind: 'exit' };
    }
    if (G.gems.length && autoIgnoreGem < 1.8) {
      best = G.gems[0];
      bestS = 1e9;
      for (i = 0; i < G.gems.length; i++) {
        g = G.gems[i];
        d = hypot(g.x - p.x, g.y - p.y);
        if (wallShot(p.x, p.y, g.x, g.y)) d += 80;
        for (j = 0; j < G.statues.length; j++) {
          if (!G.statues[j].alive) continue;
          if (circleRect(g.x, g.y, g.r + 2, statueBox(G.statues[j]))) {
            return { x: G.statues[j].x, y: G.statues[j].y, kind: 'statue', ref: G.statues[j] };
          }
        }
        if (d < bestS) {
          bestS = d;
          best = g;
        }
      }
      return { x: best.x, y: best.y, kind: 'gem' };
    }
    best = null;
    bestS = 1e9;
    for (i = 0; i < G.statues.length; i++) {
      st = G.statues[i];
      if (!st.alive) continue;
      d = hypot(st.x - p.x, st.y - p.y);
      sc = d;
      if (G.time < 22 && st.kind === 'time') sc -= 130;
      else if (st.kind === 'time') sc -= 22;
      if (G.lives < 3 && st.kind === 'heart') sc -= 70;
      if (st.kind === 'face') sc -= 12;
      if (!wallShot(p.x, p.y, st.x, st.y) && d < 220) sc -= 48;
      if (sc < bestS) {
        bestS = sc;
        best = st;
      }
    }
    if (best) return { x: best.x, y: best.y, kind: 'statue', ref: best };
    return { x: G.exit.x, y: G.exit.y, kind: 'exit' };
  }

  function spitRay(fx, fy) {
    var p = G.p;
    var len = hypot(fx, fy) || 1;
    var range = 210;
    var steps = 16;
    var i, j, x, y, st, en;
    fx /= len;
    fy /= len;
    for (i = 1; i <= steps; i++) {
      x = p.x + fx * (range * i / steps);
      y = p.y + fy * (range * i / steps);
      if (circleHit(x, y, SPIT_R, G.walls)) {
        return i <= 2 ? 'wall' : null;
      }
      for (j = 0; j < G.statues.length; j++) {
        st = G.statues[j];
        if (!st.alive) continue;
        if (circleRect(x, y, SPIT_R + 2, statueBox(st))) return 'statue';
      }
      for (j = 0; j < G.enemies.length; j++) {
        en = G.enemies[j];
        if (!en.alive) continue;
        if (hypot(x - en.x, y - en.y) < SPIT_R + en.r + 2) return 'enemy';
      }
    }
    return null;
  }

  function pickAutoAim(goal) {
    var p = G.p;
    var i, st, en, d, best, bestS, dx, dy;
    best = null;
    bestS = 1e9;
    for (i = 0; i < G.statues.length; i++) {
      st = G.statues[i];
      if (!st.alive) continue;
      d = hypot(st.x - p.x, st.y - p.y);
      if (d < 8 || d > 240) continue;
      if (wallShot(p.x, p.y, st.x, st.y)) continue;
      if (d < bestS) {
        bestS = d;
        best = st;
      }
    }
    for (i = 0; i < G.enemies.length; i++) {
      en = G.enemies[i];
      if (!en.alive) continue;
      d = hypot(en.x - p.x, en.y - p.y);
      if (d < 12 || d > 170) continue;
      if (wallShot(p.x, p.y, en.x, en.y)) continue;
      if (en.kind === 'skull') d *= 0.62;
      if (d < 86 && d < bestS) {
        bestS = d;
        best = en;
      }
    }
    if (goal && goal.kind === 'statue') {
      d = hypot(goal.x - p.x, goal.y - p.y);
      if (d < 240 && !wallShot(p.x, p.y, goal.x, goal.y) && (!best || d < bestS + 36)) best = goal;
    }
    if (!best) return false;
    dx = (best.x || 0) - p.x;
    dy = (best.y || 0) - p.y;
    d = hypot(dx, dy) || 1;
    autoAimX = dx / d;
    autoAimY = dy / d;
    return true;
  }

  function autoThink() {
    var p, solids, goal, wp, hover, dx, dy, d, bestS, bx, by, i, a, nx, ny, s, stay, hit;
    var dirs, reach, wantSpit, dang, chase, fear;
    keys.l = keys.r = keys.u = keys.d = keys.spit = false;
    spitEdge = false;
    autoAimX = 0;
    autoAimY = 0;
    if (G.phase !== 'play' || G.dead || !G.p) return;
    p = G.p;
    solids = solidsOf(G.walls, G.statues);
    if (G.got !== autoGot || G.gems.length > autoGemN) {
      autoGot = G.got;
      autoIgnoreGem = 0;
    }
    autoGemN = G.gems.length;
    goal = pickAutoGoal(solids);
    if (goal.kind === 'gem') autoIgnoreGem += STEP;
    else if (goal.kind !== 'statue') autoIgnoreGem = 0;
    hover = nearestWalk(goal.x, goal.y, solids);
    if (goal.kind === 'statue') {
      dx = p.x - goal.x;
      dy = p.y - goal.y;
      d = hypot(dx, dy) || 1;
      if (d < 160 && !wallShot(p.x, p.y, goal.x, goal.y)) {
        hover = nearestWalk(goal.x + (dx / d) * 36, goal.y + (dy / d) * 36, solids);
      }
    }
    wp = pathWaypoint(p.x, p.y, hover.x, hover.y, solids);
    if ((goal.kind === 'gem' || goal.kind === 'exit') && !wallShot(p.x, p.y, goal.x, goal.y)) {
      wp = { x: goal.x, y: goal.y };
    }
    autoWpX = wp.x;
    autoWpY = wp.y;
    dx = p.x - autoLastX;
    dy = p.y - autoLastY;
    if (hypot(dx, dy) < 5.5) autoStuck += STEP;
    else autoStuck = 0;
    autoLastX = p.x;
    autoLastY = p.y;
    d = hypot(p.x - goal.x, p.y - goal.y);
    if (autoStuck > 0.7 && !(goal.kind === 'statue' && d < 150 && !wallShot(p.x, p.y, goal.x, goal.y))) {
      a = Math.atan2(wp.y - p.y, wp.x - p.x) + (autoStuck % 1.2 < 0.6 ? 1.15 : -1.15);
      wp = { x: p.x + Math.cos(a) * 52, y: p.y + Math.sin(a) * 40 };
    }
    reach = goal.kind === 'exit' ? 40 : 32;
    dirs = [
      [0, 0],
      [1, 0], [-1, 0], [0, 1], [0, -1],
      [0.71, 0.71], [0.71, -0.71], [-0.71, 0.71], [-0.71, -0.71]
    ];
    bestS = -1e12;
    bx = 0;
    by = 0;
    d = hypot(p.x - wp.x, p.y - wp.y);
    chase = goal.kind === 'gem' ? 4.4 : goal.kind === 'exit' ? 3.6 : 2.0;
    fear = goal.kind === 'gem' ? 0.42 : goal.kind === 'exit' ? 0.55 : 1;
    for (i = 0; i < dirs.length; i++) {
      nx = clamp(p.x + dirs[i][0] * reach, 28, WORLD_W - 28);
      ny = clamp(p.y + dirs[i][1] * reach, 28, WORLD_H - 28);
      s = 0;
      if (!walkAt(nx, ny, solids)) s -= 1400;
      s -= hypot(nx - wp.x, ny - wp.y) * chase;
      s -= dangerAt(nx, ny) * fear;
      if (goal.kind === 'statue' && !wallShot(nx, ny, goal.x, goal.y)) s += 28;
      if (dirs[i][0] === autoMX && dirs[i][1] === autoMY) s += 14;
      if (s > bestS) {
        bestS = s;
        bx = dirs[i][0];
        by = dirs[i][1];
      }
    }
    stay = -d * chase - dangerAt(p.x, p.y) * fear;
    dang = dangerAt(p.x, p.y);
    if (goal.kind === 'gem' || goal.kind === 'exit') {
      if (d > 12) {
        if (bx === 0 && by === 0) {
          dx = wp.x - p.x;
          dy = wp.y - p.y;
          autoMX = dx > 8 ? 1 : dx < -8 ? -1 : 0;
          autoMY = dy > 8 ? 1 : dy < -8 ? -1 : 0;
        } else {
          autoMX = bx;
          autoMY = by;
        }
      } else {
        autoMX = 0;
        autoMY = 0;
      }
    } else if (bestS > stay + (dang > 180 ? 8 : 32)) {
      autoMX = bx;
      autoMY = by;
    } else if (stay >= bestS - 10) {
      autoMX = 0;
      autoMY = 0;
    }
    if (autoMX < -0.28) keys.l = true;
    else if (autoMX > 0.28) keys.r = true;
    if (autoMY < -0.28) keys.u = true;
    else if (autoMY > 0.28) keys.d = true;

    if (goal.kind === 'gem' || goal.kind === 'exit') {
      dx = goal.x - p.x;
      dy = goal.y - p.y;
      d = hypot(dx, dy) || 1;
      autoAimX = dx / d;
      autoAimY = dy / d;
      wantSpit = false;
    } else {
      wantSpit = pickAutoAim(goal);
      if (!wantSpit && (autoMX || autoMY)) {
        autoAimX = autoMX;
        autoAimY = autoMY;
      }
    }
    hit = spitRay(autoAimX || p.fx, autoAimY || p.fy);
    if (hit === 'statue' || hit === 'enemy' || (wantSpit && hit !== 'wall')) {
      keys.spit = true;
      spitEdge = true;
    }
  }

  function clearAutoKeys() {
    keys.u = false;
    keys.d = false;
    keys.l = false;
    keys.r = false;
    keys.spit = false;
    spitEdge = false;
    ptr.down = false;
    ptr.drag = false;
    ptr.ax = 0;
    ptr.ay = 0;
    autoMX = 0;
    autoMY = 0;
    autoAimX = 0;
    autoAimY = 0;
    autoStuck = 0;
  }

  function syncAutoUi() {
    if (!btnAuto) return;
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.textContent = autoOn ? '停下' : '自动';
    btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
  }

  function syncSpeedUi() {
    if (speedEl) speedEl.value = String(autoSpeed);
    if (speedLab) speedLab.textContent = SPEED_LABELS[autoSpeed];
    if (speedEl) {
      speedEl.title = SPEED_LABELS[autoSpeed];
      speedEl.setAttribute('aria-valuetext', SPEED_LABELS[autoSpeed]);
    }
  }

  function autoScale() {
    if (!autoOn || G.phase !== 'play') return 1;
    return AUTO_SCALE[autoSpeed] || 1;
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
    clearAutoKeys();
    syncAutoUi();
    if (autoOn) {
      audio.ensure();
      if (G.phase === 'title') startRun('quarry');
      else if (G.phase === 'win' || G.phase === 'lose') startRun(G.lastMode || 'quarry');
    }
  }

  function tickAutoFlow(dt) {
    var wait;
    if (!autoOn) return;
    if (G.phase === 'title') {
      autoOvWait += dt;
      wait = autoSpeed >= 3 ? 0.22 : 0.5;
      if (autoOvWait >= wait) {
        autoOvWait = 0;
        startRun('quarry');
      }
      return;
    }
    if (G.phase === 'win' || G.phase === 'lose') {
      autoOvWait += dt;
      wait = autoSpeed >= 4 ? 0.28 : autoSpeed >= 3 ? 0.65 : autoSpeed >= 2 ? 0.9 : 1.2;
      if (autoOvWait >= wait) {
        autoOvWait = 0;
        startRun(G.lastMode || 'quarry');
      }
    }
  }

  function wantXY() {
    var ix = 0;
    var iy = 0;
    if (keys.l) ix -= 1;
    if (keys.r) ix += 1;
    if (keys.u) iy -= 1;
    if (keys.d) iy += 1;
    if (!autoOn && ptr.down && ptr.drag) {
      ix += ptr.ax;
      iy += ptr.ay;
    }
    if (ix !== 0 || iy !== 0) {
      var len = hypot(ix, iy);
      if (len > 1) {
        ix /= len;
        iy /= len;
      }
    }
    return { x: ix, y: iy };
  }

  function moveSlide(o, dt, solids) {
    var nx = o.x + o.vx * dt;
    var bump = 0;
    if (circleHit(nx, o.y, o.r, solids)) {
      if (Math.abs(o.vx) > 80) bump = Math.abs(o.vx);
      o.vx = 0;
    } else o.x = nx;
    var ny = o.y + o.vy * dt;
    if (circleHit(o.x, ny, o.r, solids)) {
      if (Math.abs(o.vy) > 80) bump = Math.max(bump, Math.abs(o.vy));
      o.vy = 0;
    } else o.y = ny;
    if (bump) {
      G.sq = 0.82;
      if (G.wallT <= 0) {
        G.wallT = 0.14;
        audio.wall();
        emit(4, {
          x: o.x, y: o.y, j: 3,
          vx0: -50, vx1: 50, vy0: -70, vy1: 20,
          life: 0.16, r0: 0.8, r1: 1.8, rgb: HOT, g: 0
        });
      }
    }
  }

  function moveBounce(o, dt, solids) {
    var nx = o.x + o.vx * dt;
    if (circleHit(nx, o.y, o.r, solids)) o.vx = -o.vx;
    else o.x = nx;
    var ny = o.y + o.vy * dt;
    if (circleHit(o.x, ny, o.r, solids)) o.vy = -o.vy;
    else o.y = ny;
  }

  function updatePlayer(dt, solids) {
    var p = G.p;
    var w = wantXY();
    p.vx += w.x * ACCEL * dt;
    p.vy += w.y * ACCEL * dt;
    p.vx -= p.vx * DRAG * dt;
    p.vy -= p.vy * DRAG * dt;
    var sp = hypot(p.vx, p.vy);
    if (sp > MAX_V) {
      p.vx *= MAX_V / sp;
      p.vy *= MAX_V / sp;
    }
    if (autoOn && (autoAimX !== 0 || autoAimY !== 0)) {
      p.fx = autoAimX;
      p.fy = autoAimY;
    } else if (w.x !== 0 || w.y !== 0) {
      p.fx = w.x;
      p.fy = w.y;
    }
    moveSlide(p, dt, solids);
    p.x = clamp(p.x, 20, WORLD_W - 20);
    p.y = clamp(p.y, 20, WORLD_H - 20);
    p.flap += dt * (8 + hypot(p.vx, p.vy) * 0.03);
    if (p.spitFlash > 0) p.spitFlash -= dt;
    if (G.wallT > 0) G.wallT -= dt;
    G.sq = lerp(G.sq, 1, 1 - Math.exp(-dt * 14));
    if (keys.spit || spitEdge) spitFire();
    spitEdge = false;
    if (G.spitCd > 0) G.spitCd -= dt;
  }

  function updateShots(dt, solids) {
    var i, s, j, st, en, hit;
    for (i = G.shots.length - 1; i >= 0; i--) {
      s = G.shots[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0 || s.x < 8 || s.y < 8 || s.x > WORLD_W - 8 || s.y > WORLD_H - 8) {
        G.shots.splice(i, 1);
        continue;
      }
      hit = circleHit(s.x, s.y, s.r, G.walls);
      if (hit) {
        emit(6, {
          x: s.x, y: s.y, j: 2,
          vx0: -60, vx1: 60, vy0: -60, vy1: 60,
          life: 0.18, r0: 1, r1: 2.2, rgb: FIRE, g: 0
        });
        G.shots.splice(i, 1);
        continue;
      }
      for (j = 0; j < G.statues.length; j++) {
        st = G.statues[j];
        if (!st.alive) continue;
        if (circleRect(s.x, s.y, s.r + 2, statueBox(st))) {
          chipStatue(st, s.x, s.y);
          G.shots.splice(i, 1);
          s = null;
          break;
        }
      }
      if (!s) continue;
      for (j = 0; j < G.enemies.length; j++) {
        en = G.enemies[j];
        if (!en.alive) continue;
        if (hypot(s.x - en.x, s.y - en.y) < s.r + en.r) {
          killEnemy(en);
          G.shots.splice(i, 1);
          s = null;
          break;
        }
      }
    }
  }

  function updateGems(dt, solids) {
    var i, g, dx, dy, d, p;
    p = G.p;
    for (i = G.gems.length - 1; i >= 0; i--) {
      g = G.gems[i];
      g.t += dt * 6;
      g.vx *= Math.exp(-dt * 2.4);
      g.vy *= Math.exp(-dt * 2.4);
      dx = p.x - g.x;
      dy = p.y - g.y;
      d = hypot(dx, dy);
      if (!G.dead && d < MAGNET) {
        g.vx += (dx / (d || 1)) * 220 * dt;
        g.vy += (dy / (d || 1)) * 220 * dt;
      }
      moveBounce(g, dt, G.walls);
      if (!G.dead && hypot(p.x - g.x, p.y - g.y) < p.r + g.r + 2) collectGem(g);
    }
  }

  function updateEnemies(dt, solids) {
    var i, en, p, dx, dy, d, ang;
    p = G.p;
    for (i = 0; i < G.enemies.length; i++) {
      en = G.enemies[i];
      if (!en.alive) continue;
      en.t += dt;
      if (en.kind === 'skull' && !G.dead) {
        dx = p.x - en.x;
        dy = p.y - en.y;
        d = hypot(dx, dy) || 1;
        en.vx += (dx / d) * en.spd * 1.6 * dt;
        en.vy += (dy / d) * en.spd * 1.6 * dt;
        d = hypot(en.vx, en.vy);
        if (d > en.spd) {
          en.vx *= en.spd / d;
          en.vy *= en.spd / d;
        }
      } else if (en.kind === 'bat') {
        if (Math.abs(en.vx) < 20) en.vx = en.spd * (en.x < WORLD_W * 0.5 ? 1 : -1);
        en.vy = Math.cos(en.t * 2.4) * 46;
      }
      moveBounce(en, dt, solids);
      en.x = clamp(en.x, 28, WORLD_W - 28);
      en.y = clamp(en.y, 28, WORLD_H - 28);
      if (!G.dead && G.inv <= 0 && hypot(p.x - en.x, p.y - en.y) < p.r + en.r - 1) {
        killPlayer(en.kind === 'skull' ? '撞上颅' : en.kind === 'bat' ? '撞上蝠' : '撞上魔');
      }
    }
  }

  function updateFx(dt) {
    var i, p, r;
    for (i = particles.length - 1; i >= 0; i--) {
      p = particles[i];
      p.t -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      if (p.t <= 0) particles.splice(i, 1);
    }
    for (i = pops.length - 1; i >= 0; i--) {
      pops[i].t -= dt;
      pops[i].y -= 22 * dt;
      if (pops[i].t <= 0) pops.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.45) rings.splice(i, 1);
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    if (lastAddT > 0) {
      lastAddT -= dt;
      if (lastAddT <= 0 && scoreAdd) scoreAdd.hidden = true;
    }
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        if (comboEl) comboEl.textContent = '×1';
        if (comboBox) comboBox.classList.remove('hot');
        if (comboLabel) comboLabel.hidden = true;
      }
    }
    for (i = 0; i < motes.length; i++) {
      r = motes[i];
      r.y += r.s * dt;
      if (r.y > 1) r.y -= 1;
    }
  }

  function updatePlay(dt) {
    var solids, p, i, st;
    if (G.dead) {
      G.deadT -= dt;
      updateFx(dt);
      if (G.deadT <= 0) respawn();
      return;
    }
    if (G.inv > 0) G.inv -= dt;
    G.time -= dt;
    if (G.time < 10) {
      G.tickT -= dt;
      if (G.tickT <= 0) {
        G.tickT = G.time < 4 ? 0.28 : 0.55;
        audio.tick();
        if (timeWrap) timeWrap.classList.add('warn');
      }
    }
    if (G.time <= 0) {
      G.time = 0;
      killPlayer('时尽');
    }
    solids = solidsOf(G.walls, G.statues);
    updatePlayer(dt, solids);
    updateShots(dt, solids);
    updateGems(dt, solids);
    updateEnemies(dt, solids);
    p = G.p;
    for (i = 0; i < G.statues.length; i++) {
      st = G.statues[i];
      if (st.flash > 0) st.flash -= dt;
      st.wob += dt;
    }
    if (G.exitOn && hypot(p.x - G.exit.x, p.y - G.exit.y) < p.r + EXIT_R - 4) {
      nextRoom();
      return;
    }
    updateFx(dt);
    if (timeBar) {
      var t = G.timeMax > 0 ? clamp(G.time / G.timeMax, 0, 1) : 0;
      timeBar.style.transform = 'scaleX(' + t + ')';
    }
    if (timeWrap) timeWrap.classList.toggle('warn', G.time < 10);
  }

  function seedMotes() {
    motes.length = 0;
    var i;
    for (i = 0; i < 28; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: rand(0.6, 1.8),
        a: rand(0.04, 0.14),
        s: rand(0.02, 0.06)
      });
    }
  }

  function resize() {
    if (!canvas || !stageEl) return;
    var rect = stageEl.getBoundingClientRect();
    dpr = Math.min(2.25, window.devicePixelRatio || 1);
    W = Math.max(1, Math.floor(rect.width * dpr));
    H = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width = W;
    canvas.height = H;
    scale = Math.min(W / WORLD_W, H / WORLD_H);
    ox = (W - WORLD_W * scale) * 0.5;
    oy = (H - WORLD_H * scale) * 0.5;
    seedMotes();
  }

  function clientToWorld(cx, cy) {
    var r = canvas.getBoundingClientRect();
    var x = (cx - r.left) * (W / r.width);
    var y = (cy - r.top) * (H / r.height);
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function roundRect(x, y, w, h, r) {
    var rr = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawBg() {
    var g = ctx.createLinearGradient(0, 0, 0, WORLD_H);
    g.addColorStop(0, '#140820');
    g.addColorStop(0.55, '#0c0616');
    g.addColorStop(1, '#080312');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    var i, m, x;
    ctx.fillStyle = 'rgba(40, 16, 64, 0.55)';
    for (i = 0; i < 11; i++) {
      x = 18 + i * 56;
      ctx.beginPath();
      ctx.moveTo(x, 18);
      ctx.lineTo(x + 10, 18 + 16 + (i % 3) * 8);
      ctx.lineTo(x + 20, 18);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(28, 10, 44, 0.5)';
    for (i = 0; i < 9; i++) {
      x = 40 + i * 66;
      ctx.beginPath();
      ctx.moveTo(x, WORLD_H - 18);
      ctx.lineTo(x + 12, WORLD_H - 18 - 12 - (i % 2) * 8);
      ctx.lineTo(x + 24, WORLD_H - 18);
      ctx.fill();
    }
    for (i = 0; i < motes.length; i++) {
      m = motes[i];
      ctx.fillStyle = rgba(HOT, m.a);
      ctx.beginPath();
      ctx.arc(m.x * WORLD_W, m.y * WORLD_H, m.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawWalls() {
    var i, w;
    for (i = 0; i < G.walls.length; i++) {
      w = G.walls[i];
      ctx.fillStyle = '#1a0c28';
      roundRect(w.x, w.y, w.w, w.h, 3);
      ctx.fill();
      ctx.strokeStyle = 'rgba(196, 77, 255, 0.55)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
      ctx.lineWidth = 0.6;
      ctx.strokeRect(w.x + 2, w.y + 2, Math.max(0, w.w - 4), Math.max(0, w.h - 4));
    }
  }

  function drawExit() {
    if (!G.exitOn && G.phase === 'play') {
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(G.exit.x, G.exit.y, 10, 0, TAU);
      ctx.stroke();
      return;
    }
    if (!G.exitOn) return;
    var t = performance.now() / 1000;
    var i;
    ctx.save();
    ctx.translate(G.exit.x, G.exit.y);
    ctx.rotate(t * 1.4);
    for (i = 0; i < 3; i++) {
      ctx.strokeStyle = rgba(i === 1 ? GOLD : CYN, 0.55 - i * 0.12);
      ctx.lineWidth = 2 - i * 0.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 16 - i * 3, 10 - i * 2, i * 0.6, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = rgba(CYN, 0.18 + Math.sin(t * 6) * 0.08);
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawStatue(st) {
    var cracked = st.hp < st.max;
    var fl = st.flash > 0;
    var eye = st.kind === 'time' ? CYN : st.kind === 'heart' ? MAG : GOLD;
    ctx.save();
    ctx.translate(st.x, st.y + Math.sin(st.wob * 2) * 0.4);
    ctx.fillStyle = fl ? '#c8b0e0' : '#4a3264';
    roundRect(-14, -17, 28, 34, 4);
    ctx.fill();
    ctx.strokeStyle = fl ? rgba(WHT, 0.9) : 'rgba(196, 140, 230, 0.7)';
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.fillStyle = rgba(eye, 0.9);
    ctx.beginPath();
    ctx.arc(-5, -4, 2.2, 0, TAU);
    ctx.arc(5, -4, 2.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a0c22';
    ctx.beginPath();
    ctx.ellipse(0, 8, 6, 3.2, 0, 0, TAU);
    ctx.fill();
    if (cracked) {
      ctx.strokeStyle = 'rgba(10, 4, 16, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-4, -16);
      ctx.lineTo(0, -2);
      ctx.lineTo(-6, 14);
      ctx.moveTo(6, -8);
      ctx.lineTo(3, 6);
      ctx.stroke();
    }
    if (st.kind === 'time') {
      ctx.strokeStyle = rgba(CYN, 0.8);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -15);
      ctx.lineTo(0, -20);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGem(g) {
    var bob = Math.sin(g.t) * 2.2;
    ctx.save();
    ctx.translate(g.x, g.y + bob);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.shadowColor = rgba(GOLD, 0.6);
    ctx.shadowBlur = 8;
    ctx.fillRect(-4.2, -4.2, 8.4, 8.4);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,240,0.7)';
    ctx.fillRect(-2, -2, 3, 3);
    ctx.restore();
  }

  function drawEnemy(en) {
    var rgb = kindRgb(en.kind);
    ctx.save();
    ctx.translate(en.x, en.y);
    if (en.kind === 'bat') {
      var wf = Math.sin(en.t * 10) * 5;
      ctx.fillStyle = rgba(HOT, 0.85);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-12, -wf, -16, 2);
      ctx.quadraticCurveTo(-8, 4, 0, 2);
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(12, -wf, 16, 2);
      ctx.quadraticCurveTo(8, 4, 0, 2);
      ctx.fill();
      ctx.fillStyle = rgba(rgb, 1);
      ctx.beginPath();
      ctx.ellipse(0, 1, 5, 4, 0, 0, TAU);
      ctx.fill();
    } else if (en.kind === 'skull') {
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.beginPath();
      ctx.arc(0, -1, 8, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#140814';
      ctx.beginPath();
      ctx.arc(-3.2, -2, 2, 0, TAU);
      ctx.arc(3.2, -2, 2, 0, TAU);
      ctx.fill();
      ctx.fillRect(-3, 4, 6, 2);
    } else {
      ctx.fillStyle = rgba(FIRE, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, 1, 7, 8, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.moveTo(-4, -7);
      ctx.lineTo(-1, -13);
      ctx.lineTo(1, -7);
      ctx.moveTo(4, -7);
      ctx.lineTo(1, -13);
      ctx.lineTo(-1, -7);
      ctx.fill();
      ctx.fillStyle = '#140810';
      ctx.beginPath();
      ctx.arc(-2.4, 0, 1.4, 0, TAU);
      ctx.arc(2.4, 0, 1.4, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawShot(s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    var ang = Math.atan2(s.vy, s.vx);
    ctx.rotate(ang);
    var g = ctx.createLinearGradient(-10, 0, 6, 0);
    g.addColorStop(0, 'rgba(255,80,20,0)');
    g.addColorStop(0.5, rgba(FIRE, 0.8));
    g.addColorStop(1, '#fff3c0');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 3.4, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawDemon(p) {
    if (G.inv > 0 && ((G.inv * 16) | 0) % 2 === 0) return;
    var ang = Math.atan2(p.fy, p.fx);
    var wf = Math.sin(p.flap) * 0.45;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(ang);
    ctx.scale(G.sq, 2 - G.sq);
    ctx.strokeStyle = rgba(CYN, 0.9);
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.ellipse(-1, 0, 13, 6.5, 0, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = rgba(HOT, 0.55);
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.quadraticCurveTo(-8, -12 - wf * 8, -18, -2);
    ctx.quadraticCurveTo(-8, 2, -2, 4);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.quadraticCurveTo(-6, 12 + wf * 8, -16, 8);
    ctx.quadraticCurveTo(-6, 2, -2, -2);
    ctx.fill();
    ctx.fillStyle = '#d080ff';
    ctx.beginPath();
    ctx.ellipse(0, 0, 8.5, 7.2, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#f0d0ff';
    ctx.beginPath();
    ctx.ellipse(2, 1, 4.2, 3.6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(2, -6);
    ctx.lineTo(5, -13);
    ctx.lineTo(7, -5);
    ctx.moveTo(2, 6);
    ctx.lineTo(5, 13);
    ctx.lineTo(7, 5);
    ctx.fill();
    ctx.fillStyle = '#ffe36b';
    ctx.beginPath();
    ctx.arc(5, -2.2, 1.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a0818';
    ctx.beginPath();
    ctx.arc(5.3, -2.2, 0.7, 0, TAU);
    ctx.fill();
    if (p.spitFlash > 0) {
      ctx.fillStyle = rgba(FIRE, 0.9);
      ctx.beginPath();
      ctx.ellipse(10, 0, 7, 3, 0, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = '#3a1028';
      ctx.beginPath();
      ctx.ellipse(8, 0, 2.4, 1.6, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFx() {
    var i, p, a, r;
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      a = clamp(p.t / p.life, 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * a, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < rings.length; i++) {
      r = rings[i];
      a = 1 - r.t / 0.45;
      ctx.strokeStyle = rgba(r.rgb, a);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 8 + r.t * 46, 0, TAU);
      ctx.stroke();
    }
    ctx.font = '700 11px "Segoe UI", "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    for (i = 0; i < pops.length; i++) {
      p = pops[i];
      a = clamp(p.t / p.life, 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.fillText(p.text, p.x, p.y);
    }
  }

  function drawTitleIdle() {
    var t = performance.now() / 1000;
    var p = { x: 220 + Math.sin(t) * 18, y: 200 + Math.cos(t * 0.7) * 12, fx: 1, fy: 0.1, flap: t * 8, spitFlash: 0 };
    drawDemon(p);
    drawStatue({ x: 400, y: 210, kind: 'face', hp: 2, max: 2, flash: 0, wob: t, alive: true });
    drawGem({ x: 460, y: 170, t: t * 4 });
    drawGem({ x: 488, y: 210, t: t * 4 + 1 });
    ctx.fillStyle = rgba(GOLD, 0.8);
    ctx.font = '700 13px "Segoe UI", "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('吐火砸像 · 收晶出窟', WORLD_W * 0.5, 70);
  }

  function draw() {
    if (!ctx) return;
    var shx = 0;
    var shy = 0;
    if (G.shake > 0 && !REDUCE) {
      shx = (Math.random() - 0.5) * G.shake;
      shy = (Math.random() - 0.5) * G.shake;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#070310';
    ctx.fillRect(0, 0, W, H);
    ctx.setTransform(scale, 0, 0, scale, ox + shx * scale, oy + shy * scale);
    drawBg();
    if (G.phase === 'title') {
      drawWalls();
      drawTitleIdle();
    } else {
      drawWalls();
      drawExit();
      var i;
      for (i = 0; i < G.statues.length; i++) if (G.statues[i].alive) drawStatue(G.statues[i]);
      for (i = 0; i < G.gems.length; i++) drawGem(G.gems[i]);
      for (i = 0; i < G.enemies.length; i++) if (G.enemies[i].alive) drawEnemy(G.enemies[i]);
      for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);
      if (!G.dead) drawDemon(G.p);
      drawFx();
    }
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash);
      ctx.fillRect(-20, -20, WORLD_W + 40, WORLD_H + 40);
    }
  }

  function playing() {
    return G.phase === 'play';
  }

  function onKey(e, down) {
    var k = e.key;
    var code = e.code;
    if (k === ' ' || k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight') {
      e.preventDefault();
    }
    if (k === 'a' || k === 'A' || code === 'KeyA') {
      e.preventDefault();
      if (down && !e.repeat) {
        audio.ensure();
        toggleAuto();
      }
      return;
    }
    if (down && (k === 'm' || k === 'M')) {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (down && (k === 'r' || k === 'R')) {
      e.preventDefault();
      audio.ensure();
      restart();
      return;
    }
    if (autoOn) return;
    if (down && G.phase === 'title') {
      if (k === 'Enter' || k === ' ' || k === '1') {
        audio.ensure();
        startRun('quarry');
        return;
      }
      if (k === '2') {
        audio.ensure();
        startRun('tide');
        return;
      }
    }
    if (down && (G.phase === 'win' || G.phase === 'lose')) {
      if (k === 'Enter' || k === ' ') {
        audio.ensure();
        startRun(G.lastMode);
        return;
      }
    }
    if (!playing()) return;
    if (code === 'ArrowUp' || k === 'w' || k === 'W') keys.u = down;
    if (code === 'ArrowDown' || k === 's' || k === 'S') keys.d = down;
    if (code === 'ArrowLeft') keys.l = down;
    if (code === 'ArrowRight' || k === 'd' || k === 'D') keys.r = down;
    if (k === ' ' || code === 'Space') {
      if (down && !keys.spit) spitEdge = true;
      keys.spit = down;
    }
  }

  function restart() {
    audio.ensure();
    if (G.phase === 'title') startRun('quarry');
    else startRun(G.lastMode || 'quarry');
  }

  function bootTitle() {
    G.phase = 'title';
    G.mode = 'quarry';
    G.walls = BORDER.concat(ROOMS[0].walls);
    G.statues = [];
    G.enemies = [];
    G.shots = [];
    G.gems = [];
    G.combo = 0;
    G.got = 0;
    G.quota = 0;
    G.exitOn = false;
    G.lives = LIVES;
    showOverlay('title');
    setHint('吐火砸石像 · 宝石收够出口开 · 撞墙不疼，撞敌扣命');
    syncHud();
  }

  function bindPad(btn, dir) {
    if (!btn) return;
    var start = function (ev) {
      ev.preventDefault();
      audio.ensure();
      if (autoOn) return;
      btn.classList.add('held');
      if (dir === 'spit') {
        keys.spit = true;
        spitEdge = true;
        return;
      }
      if (dir === 'up') keys.u = true;
      if (dir === 'down') keys.d = true;
      if (dir === 'left') keys.l = true;
      if (dir === 'right') keys.r = true;
    };
    var end = function (ev) {
      ev.preventDefault();
      btn.classList.remove('held');
      if (dir === 'spit') {
        keys.spit = false;
        return;
      }
      if (dir === 'up') keys.u = false;
      if (dir === 'down') keys.d = false;
      if (dir === 'left') keys.l = false;
      if (dir === 'right') keys.r = false;
    };
    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', end);
    btn.addEventListener('pointerleave', end);
    btn.addEventListener('pointercancel', end);
  }

  function onPointerDown(e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    if (autoOn) return;
    if (G.phase === 'title') return;
    if (G.phase !== 'play') return;
    e.preventDefault();
    var w = clientToWorld(e.clientX, e.clientY);
    ptr.down = true;
    ptr.id = e.pointerId;
    ptr.sx = w.x;
    ptr.sy = w.y;
    ptr.x = w.x;
    ptr.y = w.y;
    ptr.drag = false;
    ptr.ax = 0;
    ptr.ay = 0;
    if (canvas && canvas.setPointerCapture) {
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
  }

  function onPointerMove(e) {
    if (!ptr.down || e.pointerId !== ptr.id) return;
    var w = clientToWorld(e.clientX, e.clientY);
    ptr.x = w.x;
    ptr.y = w.y;
    var dx = w.x - ptr.sx;
    var dy = w.y - ptr.sy;
    if (hypot(dx, dy) > 14) ptr.drag = true;
    if (ptr.drag) {
      var len = hypot(dx, dy) || 1;
      ptr.ax = dx / len;
      ptr.ay = dy / len;
    }
  }

  function onPointerUp(e) {
    if (!ptr.down || (e.pointerId != null && e.pointerId !== ptr.id)) return;
    if (!ptr.drag && G.phase === 'play') spitFire();
    ptr.down = false;
    ptr.drag = false;
    ptr.ax = 0;
    ptr.ay = 0;
  }

  if (btnQuarry) btnQuarry.addEventListener('click', function () {
    this.blur();
    audio.ensure();
    startRun('quarry');
  });
  if (btnTide) btnTide.addEventListener('click', function () {
    this.blur();
    audio.ensure();
    startRun('tide');
  });
  if (ovRetry) ovRetry.addEventListener('click', function () {
    this.blur();
    audio.ensure();
    startRun(G.lastMode);
  });
  if (ovMenu) ovMenu.addEventListener('click', function () {
    this.blur();
    audio.ensure();
    bootTitle();
  });
  if (btnRetry) btnRetry.addEventListener('click', function () {
    this.blur();
    restart();
  });
  if (btnMute) btnMute.addEventListener('click', function () {
    this.blur();
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  if (btnAuto) btnAuto.addEventListener('click', function () {
    this.blur();
    audio.ensure();
    toggleAuto();
  });
  if (speedEl) {
    var onSpeed = function () { setAutoSpeed(speedEl.value); };
    speedEl.addEventListener('input', onSpeed);
    speedEl.addEventListener('change', onSpeed);
  }

  bindPad(padBtns.up, 'up');
  bindPad(padBtns.down, 'down');
  bindPad(padBtns.left, 'left');
  bindPad(padBtns.right, 'right');
  bindPad(padBtns.spit, 'spit');

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.u = keys.d = keys.l = keys.r = keys.spit = false;
    ptr.down = false;
    ptr.drag = false;
  });
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden) {
      last = performance.now();
      acc = 0;
    }
  });
  window.addEventListener('resize', resize);

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (e) { /* ignore */ }

  loadBest();
  autoSpeed = loadAutoSpeed();
  syncSpeedUi();
  syncAutoUi();
  resize();
  bootTitle();
  syncHud();

  if (padEl && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
    setHint('拖动画布飞 · 点按或「吐」喷火');
  }

  var last = performance.now();
  var acc = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (hidden) {
      last = now;
      return;
    }
    var dt = (now - last) / 1000;
    last = now;
    if (dt > 0.08) dt = 0.08;
    if (autoOn) tickAutoFlow(dt);
    var turbo = autoOn && autoSpeed >= 4 && G.phase === 'play';
    if (turbo) G.stop = 0;
    acc += dt * autoScale();
    var n = 0;
    var maxSteps = turbo ? 16 : 8;
    while (acc >= STEP && n < maxSteps) {
      if (G.stop > 0) {
        if (turbo) G.stop = 0;
        else {
          G.stop -= STEP;
          updateFx(STEP * 0.35);
          acc -= STEP;
          n += 1;
          continue;
        }
      }
      if (G.phase === 'play') {
        if (autoOn && !G.dead) autoThink();
        updatePlay(STEP);
      } else {
        updateFx(STEP);
      }
      acc -= STEP;
      n += 1;
    }
    if (acc > STEP * 6) acc = 0;
    draw();
  }
  requestAnimationFrame(frame);
})();
