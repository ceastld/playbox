'use strict';

/* 迷宫车 — Rally-X remake. No CDN. Hue 40. */

(function () {
  var COLS = 38;
  var ROWS = 28;
  var LIVES = 3;
  var EXTRA_LIFE = 12000;
  var TURN_PRE = 0.4;
  var HIT_R2 = 0.5 * 0.5;
  var ROCK_R2 = 0.38 * 0.38;
  var FLAG_R2 = 0.5 * 0.5;
  var SWIPE_MIN = 24;
  var READY_SEC = 1.45;
  var CRASH_SEC = 1.12;
  var CLEAR_SEC = 1.55;
  var BEST_KEY = 'playbox-rally-x-best';
  var MUTE_KEY = 'playbox-rally-x-mute';
  var TAU = Math.PI * 2;
  var ROAD = 0;
  var WALL = 1;
  var ROCK = 2;
  var OPS = '方向键 / WASD 开 · 空格烟幕 · R 重开 · M 静音';

  var DIRS = {
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 }
  };
  var OPP = { left: 'right', right: 'left', up: 'down', down: 'up' };
  var DIR_ORDER = ['up', 'left', 'down', 'right'];
  var DIR_ANG = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
  var KEY_DIR = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
    KeyA: 'left', KeyD: 'right', KeyW: 'up', KeyS: 'down'
  };

  var GOLD = [255, 227, 107];
  var AMBER = [255, 154, 50];
  var MAG = [255, 61, 184];
  var CYAN = [0, 240, 255];
  var RED = [255, 58, 72];
  var LIME = [61, 255, 136];
  var SMOKEC = [210, 228, 236];

  var STAGES = [
    { name: '郊道', sub: 'ROAD', tight: false, holes: ['14,7', '8,17', '20,12'], rocks: 5, flags: 8, reds: 2, fuel: 100 },
    { name: '巷环', sub: 'LOOP', tight: false, holes: ['8,7', '26,12', '14,17'], rocks: 6, flags: 9, reds: 2, fuel: 96 },
    { name: '岩口', sub: 'ROCK', tight: false, holes: ['14,12', '20,7'], rocks: 12, flags: 10, reds: 3, fuel: 92 },
    { name: '密网', sub: 'GRID', tight: true, holes: ['12,10', '22,14'], rocks: 7, flags: 10, reds: 3, fuel: 88 },
    { name: '夜巡', sub: 'NIGHT', tight: true, holes: ['7,6', '27,18', '17,10'], rocks: 9, flags: 10, reds: 4, fuel: 84 },
    { name: '终旗', sub: 'LAST', tight: true, holes: ['17,14'], rocks: 12, flags: 10, reds: 4, fuel: 80 }
  ];

  var canvas = document.getElementById('c');
  var ctx = canvas.getContext('2d', { alpha: false });
  var overlay = document.getElementById('overlay');
  var panel = document.getElementById('panel');
  var ovKicker = document.getElementById('ov-kicker');
  var ovTitle = document.getElementById('ov-title');
  var ovLead = document.getElementById('ov-lead');
  var ovOps = document.getElementById('ov-ops');
  var ovStart = document.getElementById('ov-start');
  var ovEnd = document.getElementById('ov-end');
  var btnTour = document.getElementById('btn-tour');
  var btnHunt = document.getElementById('btn-hunt');
  var ovRetry = document.getElementById('ov-retry');
  var ovModes = document.getElementById('ov-modes');
  var btnMute = document.getElementById('btn-mute');
  var btnRetry = document.getElementById('btn-retry');
  var btnSmoke = document.getElementById('btn-smoke');
  var scoreEl = document.getElementById('score');
  var scoreBox = document.getElementById('score-box');
  var scoreAdd = document.getElementById('score-add');
  var bestEl = document.getElementById('best');
  var levelEl = document.getElementById('level');
  var comboEl = document.getElementById('combo');
  var comboBox = document.getElementById('combo-box');
  var modeLabel = document.getElementById('mode-label');
  var flagLabel = document.getElementById('flag-label');
  var fuelBar = document.getElementById('fuel-bar');
  var pipsEl = document.getElementById('pips');
  var toastEl = document.getElementById('toast');
  var chainPop = document.getElementById('chain-pop');
  var hintEl = document.getElementById('hint');
  var stageEl = document.getElementById('stage');
  var motionQ = window.matchMedia('(prefers-reduced-motion: reduce)');

  var view = { w: 1, h: 1, dpr: 1, tile: 16, ox: 0, oy: 0, mw: 1, mh: 1, side: true, radar: 96, vc: 16, vr: 12 };
  var particles = [];
  var pops = [];
  var swipe = { x: 0, y: 0, on: false, id: 0 };
  var keys = { u: false, d: false, l: false, r: false };
  var lastTs = 0;
  var toastTok = 0;
  var chainTok = 0;
  var hud = { score: -1, best: -1, level: -1, combo: -1, lives: -1, fuel: -1, flags: -1, kind: '' };

  var bfsMark = 1;
  var bfsSeen = new Int32Array(COLS * ROWS);
  var bfsPrev = new Int32Array(COLS * ROWS);
  var bfsQ = new Int32Array(COLS * ROWS);

  var G = {
    screen: 'title',
    kind: 'tour',
    level: 1,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    flagMul: 1,
    flagsGot: 0,
    flagsTotal: 10,
    fuel: 100,
    fuelMax: 100,
    stallT: 0,
    warnT: 0,
    invuln: 0,
    readyT: 0,
    crashT: 0,
    clearT: 0,
    clock: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: MAG,
    punch: 1,
    newBest: false,
    extra: false,
    grid: null,
    flags: [],
    rocks: [],
    reds: [],
    redSpawns: [],
    smokes: [],
    car: null,
    spawn: { x: 2, y: 2 },
    camX: 0,
    camY: 0,
    toastT: 0,
    name: '郊道'
  };

  function reduceMotion() {
    return motionQ && motionQ.matches;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function tileOf(x, y) {
    return { c: clamp(x | 0, 0, COLS - 1), r: clamp(y | 0, 0, ROWS - 1) };
  }
  function inb(c, r) {
    return c >= 0 && r >= 0 && c < COLS && r < ROWS;
  }
  function dist2(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return dx * dx + dy * dy;
  }
  function snapCenter(ent) {
    ent.x = (ent.x | 0) + 0.5;
    ent.y = (ent.y | 0) + 0.5;
  }
  function nearCenter(ent, slop) {
    var cx = (ent.x | 0) + 0.5;
    var cy = (ent.y | 0) + 0.5;
    return Math.abs(ent.x - cx) <= slop && Math.abs(ent.y - cy) <= slop;
  }
  function cell(c, r) {
    if (!inb(c, r) || !G.grid) return WALL;
    return G.grid[r][c];
  }
  function isRock(c, r) {
    return cell(c, r) === ROCK;
  }
  function roadWalk(c, r) {
    return cell(c, r) === ROAD;
  }
  function playerWalk(c, r) {
    var t = cell(c, r);
    return t === ROAD || t === ROCK;
  }
  function redWalk(c, r) {
    return cell(c, r) === ROAD;
  }
  function seedRng(seed) {
    var s = seed | 0;
    return function () {
      s = (Math.imul(s, 1664525) + 1013904223) | 0;
      return (s >>> 0) / 4294967296;
    };
  }
  function loadBest() {
    try {
      var n = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
      return isFinite(n) ? n : 0;
    } catch (e) {
      return 0;
    }
  }
  function saveBest(n) {
    try { localStorage.setItem(BEST_KEY, String(n)); } catch (e) { /* ignore */ }
  }
  function loadMute() {
    try { return localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { return false; }
  }

  /* ---- audio ---- */
  var audio = {
    ctx: null,
    master: null,
    muted: false,
    noiseBuf: null,
    ensure: function () {
      if (!this.ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.32;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.32;
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (e) { /* ignore */ }
    },
    beep: function (freq, dur, type, vol, slide, delay) {
      if (!this.ctx || this.muted) return;
      var t = this.ctx.currentTime + (delay || 0);
      var o = this.ctx.createOscillator();
      var g = this.ctx.createGain();
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
        var sr = this.ctx.sampleRate;
        var buf = this.ctx.createBuffer(1, (sr * 0.35) | 0, sr);
        var data = buf.getChannelData(0);
        var i;
        for (i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
      }
      var src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      var f = this.ctx.createBiquadFilter();
      f.type = type || 'bandpass';
      f.frequency.value = freq || 900;
      f.Q.value = type === 'lowpass' ? 0.7 : 1.1;
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
    flag: function (n) {
      this.ensure();
      var f = 520 + n * 90;
      this.beep(f, 0.07, 'square', 0.055, f * 1.55);
      this.beep(f * 1.5, 0.12, 'triangle', 0.04, f * 2.1, 0.04);
    },
    special: function () {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.055, 523);
      this.beep(523, 0.09, 'square', 0.05, 784, 0.07);
      this.beep(784, 0.18, 'triangle', 0.055, 1046, 0.14);
      this.noise(0.1, 0.05, 1800, 'highpass');
    },
    smoke: function () {
      this.ensure();
      this.noise(0.22, 0.1, 420, 'lowpass');
      this.beep(180, 0.16, 'sawtooth', 0.03, 70);
    },
    crash: function () {
      this.ensure();
      this.beep(320, 0.16, 'sawtooth', 0.08, 90);
      this.beep(180, 0.28, 'square', 0.06, 50, 0.08);
      this.noise(0.28, 0.12, 220, 'lowpass');
    },
    stall: function () {
      this.ensure();
      this.beep(140, 0.12, 'sawtooth', 0.05, 60);
      this.beep(90, 0.22, 'sine', 0.04, 40, 0.08);
    },
    warn: function () {
      this.ensure();
      this.beep(240, 0.07, 'square', 0.035, 180);
    },
    deny: function () {
      this.ensure();
      this.beep(160, 0.08, 'square', 0.04, 90);
    },
    daze: function () {
      this.ensure();
      this.beep(220, 0.08, 'triangle', 0.03, 110);
      this.noise(0.1, 0.05, 500, 'lowpass');
    },
    clear: function () {
      this.ensure();
      this.beep(392, 0.1, 'square', 0.05, 523);
      this.beep(523, 0.1, 'square', 0.05, 659, 0.1);
      this.beep(784, 0.22, 'triangle', 0.06, 1046, 0.2);
    },
    start: function () {
      this.ensure();
      this.beep(330, 0.07, 'square', 0.045, 440);
      this.beep(523, 0.12, 'triangle', 0.04, 0, 0.06);
    },
    ui: function () {
      this.ensure();
      this.beep(640, 0.04, 'square', 0.03, 880);
    },
    extra: function () {
      this.ensure();
      this.beep(523, 0.09, 'square', 0.05);
      this.beep(659, 0.09, 'square', 0.05, 0, 0.08);
      this.beep(784, 0.16, 'triangle', 0.055, 1046, 0.16);
    },
    over: function () {
      this.ensure();
      this.beep(196, 0.22, 'sawtooth', 0.05, 80);
      this.beep(110, 0.36, 'sine', 0.055, 46, 0.08);
    },
    win: function () {
      this.ensure();
      this.beep(392, 0.09, 'square', 0.05, 523);
      this.beep(523, 0.09, 'square', 0.05, 659, 0.09);
      this.beep(784, 0.12, 'triangle', 0.055, 988, 0.18);
      this.beep(1046, 0.22, 'sine', 0.05, 1318, 0.28);
    }
  };

  /* ---- juice ---- */
  function hitStop(sec) {
    if (reduceMotion()) return;
    G.stop = Math.max(G.stop, sec);
  }
  function kick(mag) {
    if (reduceMotion()) return;
    G.shake = Math.max(G.shake, mag);
  }
  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.4);
    G.flashRgb = rgb;
  }
  function punchStage(cls) {
    if (reduceMotion()) return;
    stageEl.classList.remove(cls);
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
  }
  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }
  function burst(x, y, n, rgb, spd, life, grav) {
    var i, ang, v;
    for (i = 0; i < n; i++) {
      ang = Math.random() * TAU;
      v = rand(spd * 0.2, spd);
      particles.push({
        x: x + rand(-0.1, 0.1),
        y: y + rand(-0.1, 0.1),
        vx: Math.cos(ang) * v,
        vy: Math.sin(ang) * v - rand(0, spd * 0.2),
        r: rand(0.05, 0.14),
        life: rand(life * 0.5, life),
        max: life,
        rgb: rgb,
        g: grav == null ? 2.6 : grav
      });
    }
    capArr(particles, 460);
  }
  function addPop(x, y, text, rgb, scale) {
    pops.push({ x: x, y: y, text: text, rgb: rgb, life: 0.85, max: 0.85, scale: scale || 1 });
    capArr(pops, 24);
  }
  function hudAdd(n) {
    scoreAdd.hidden = true;
    void scoreAdd.offsetWidth;
    scoreAdd.textContent = '+' + n;
    scoreAdd.hidden = false;
    scoreBox.classList.remove('flash');
    void scoreBox.offsetWidth;
    scoreBox.classList.add('flash');
  }
  function toast(msg, ms, cls) {
    toastTok += 1;
    var id = toastTok;
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden', 'warn', 'gold');
    if (cls) toastEl.classList.add(cls);
    G.toastT = (ms || 900) / 1000;
    window.setTimeout(function () {
      if (id === toastTok) toastEl.classList.add('hidden');
    }, ms || 900);
  }
  function showChain(n) {
    if (reduceMotion()) return;
    chainTok += 1;
    var id = chainTok;
    chainPop.textContent = '连旗 ×' + n;
    chainPop.classList.add('hidden');
    void chainPop.offsetWidth;
    chainPop.classList.remove('hidden');
    window.setTimeout(function () {
      if (id === chainTok) chainPop.classList.add('hidden');
    }, 720);
  }

  function persistBest() {
    if (G.score > G.best) {
      G.best = G.score;
      G.newBest = true;
      saveBest(G.best);
    }
    bestEl.textContent = String(G.best);
  }

  function addScore(n, x, y, pop) {
    var before = G.score;
    G.score += n;
    if (!G.extra && before < EXTRA_LIFE && G.score >= EXTRA_LIFE) {
      G.extra = true;
      if (G.lives < 5) {
        G.lives += 1;
        audio.extra();
        toast('加命', 1000, 'gold');
      }
    }
    persistBest();
    hudAdd(n);
    if (pop && x != null) addPop(x, y, '+' + n, GOLD, n >= 500 ? 1.25 : 1);
    paintHud(false);
  }

  /* ---- maze ---- */
  function emptyGrid() {
    var g = [];
    var r, c;
    for (r = 0; r < ROWS; r++) {
      g[r] = [];
      for (c = 0; c < COLS; c++) {
        g[r][c] = (r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1) ? WALL : ROAD;
      }
    }
    return g;
  }
  function stamp(g, c, r, w, h) {
    var x, y;
    for (y = r; y < r + h; y++) {
      for (x = c; x < c + w; x++) {
        if (inb(x, y) && y > 0 && x > 0 && y < ROWS - 1 && x < COLS - 1) g[y][x] = WALL;
      }
    }
  }
  function buildCity(tight, holes) {
    var g = emptyGrid();
    var boxW = 4;
    var boxH = 3;
    var pitchC = tight ? 5 : 6;
    var pitchR = tight ? 4 : 5;
    var holeMap = {};
    var i, r, c;
    for (i = 0; i < holes.length; i++) holeMap[holes[i]] = true;
    for (r = 2; r + boxH < ROWS - 1; r += pitchR) {
      for (c = 2; c + boxW < COLS - 1; c += pitchC) {
        if (holeMap[c + ',' + r]) continue;
        stamp(g, c, r, boxW, boxH);
      }
    }
    return g;
  }
  function floodFrom(g, sc, sr) {
    var seen = [];
    var r, c, q, qh, cur, nc, nr, k, d;
    for (r = 0; r < ROWS; r++) {
      seen[r] = [];
      for (c = 0; c < COLS; c++) seen[r][c] = false;
    }
    if (!inb(sc, sr) || g[sr][sc] !== ROAD) return seen;
    q = [[sc, sr]];
    qh = 0;
    seen[sr][sc] = true;
    while (qh < q.length) {
      cur = q[qh++];
      for (k = 0; k < 4; k++) {
        d = DIRS[DIR_ORDER[k]];
        nc = cur[0] + d.x;
        nr = cur[1] + d.y;
        if (!inb(nc, nr) || seen[nr][nc] || g[nr][nc] !== ROAD) continue;
        seen[nr][nc] = true;
        q.push([nc, nr]);
      }
    }
    return seen;
  }
  function carve(g, c0, r0, c1, r1) {
    var c = c0;
    var r = r0;
    var step;
    while (c !== c1) {
      step = c1 > c ? 1 : -1;
      c += step;
      if (c > 0 && c < COLS - 1 && r > 0 && r < ROWS - 1) g[r][c] = ROAD;
    }
    while (r !== r1) {
      step = r1 > r ? 1 : -1;
      r += step;
      if (c > 0 && c < COLS - 1 && r > 0 && r < ROWS - 1) g[r][c] = ROAD;
    }
  }
  function listRoads(g) {
    var out = [];
    var r, c;
    for (r = 1; r < ROWS - 1; r++) {
      for (c = 1; c < COLS - 1; c++) {
        if (g[r][c] === ROAD) out.push({ c: c, r: r });
      }
    }
    return out;
  }
  function degree(g, c, r) {
    var n = 0;
    var k, d;
    for (k = 0; k < 4; k++) {
      d = DIRS[DIR_ORDER[k]];
      if (inb(c + d.x, r + d.y) && g[r + d.y][c + d.x] === ROAD) n++;
    }
    return n;
  }
  function openAround(g, c, r) {
    var n = 0;
    var dy, dx;
    for (dy = -1; dy <= 1; dy++) {
      for (dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        if (inb(c + dx, r + dy) && g[r + dy][c + dx] === ROAD) n++;
      }
    }
    return n;
  }
  function spreadPick(cands, n, px, py, rnd) {
    var picked = [];
    var i, j, k, best, bestD, p, d, md, dd;
    var pool = cands.slice();
    for (i = 0; i < n && pool.length; i++) {
      best = 0;
      bestD = -1;
      for (j = 0; j < pool.length; j++) {
        p = pool[j];
        d = (p.c - px) * (p.c - px) + (p.r - py) * (p.r - py);
        md = 400;
        for (k = 0; k < picked.length; k++) {
          dd = (p.c - picked[k].c) * (p.c - picked[k].c) + (p.r - picked[k].r) * (p.r - picked[k].r);
          if (dd < md) md = dd;
        }
        if (picked.length) d = Math.sqrt(d) * Math.sqrt(md);
        d += rnd() * 8;
        if (d > bestD) {
          bestD = d;
          best = j;
        }
      }
      picked.push(pool[best]);
      pool.splice(best, 1);
    }
    return picked;
  }
  function occupied(c, r, spots) {
    var i;
    for (i = 0; i < spots.length; i++) {
      if (spots[i].c === c && spots[i].r === r) return true;
      if (Math.abs(spots[i].c - c) + Math.abs(spots[i].r - r) === 0) return true;
    }
    return false;
  }

  function makeLevel(spec, kind, seed) {
    var g = buildCity(spec.tight, spec.holes);
    var rnd = seedRng(seed);
    var roads = listRoads(g);
    var player, reds, flags, rocks;
    var i, p, reach, cands, nReds, extra;

    roads.sort(function (a, b) {
      var sa = a.r * 80 + a.c;
      var sb = b.r * 80 + b.c;
      return sa - sb;
    });
    player = roads[roads.length - 8] || roads[roads.length - 1];
    for (i = roads.length - 1; i >= 0; i--) {
      if (roads[i].r >= ROWS - 4 && roads[i].c <= 8 && degree(g, roads[i].c, roads[i].r) >= 2) {
        player = roads[i];
        break;
      }
    }

    cands = [];
    for (i = 0; i < roads.length; i++) {
      p = roads[i];
      if (Math.abs(p.c - player.c) + Math.abs(p.r - player.r) < 6) continue;
      if (degree(g, p.c, p.r) >= 2) cands.push(p);
    }
    nReds = spec.reds + (kind === 'hunt' ? 2 : 0);
    reds = spreadPick(cands, nReds, player.c, player.r, rnd);

    cands = [];
    for (i = 0; i < roads.length; i++) {
      p = roads[i];
      if (p.c === player.c && p.r === player.r) continue;
      if (occupied(p.c, p.r, reds)) continue;
      if (degree(g, p.c, p.r) >= 3 || (degree(g, p.c, p.r) === 2 && rnd() < 0.25)) cands.push(p);
    }
    if (cands.length < spec.flags) {
      for (i = 0; i < roads.length; i++) {
        p = roads[i];
        if (p.c === player.c && p.r === player.r) continue;
        if (occupied(p.c, p.r, reds) || occupied(p.c, p.r, cands)) continue;
        cands.push(p);
      }
    }
    flags = spreadPick(cands, spec.flags, player.c, player.r, rnd);
    extra = 0;
    for (i = 1; i < flags.length; i++) {
      if ((flags[i].c - player.c) * (flags[i].c - player.c) + (flags[i].r - player.r) * (flags[i].r - player.r) >
          (flags[extra].c - player.c) * (flags[extra].c - player.c) + (flags[extra].r - player.r) * (flags[extra].r - player.r)) {
        extra = i;
      }
    }

    reach = floodFrom(g, player.c, player.r);
    for (i = 0; i < flags.length; i++) {
      if (!reach[flags[i].r][flags[i].c]) {
        carve(g, player.c, player.r, flags[i].c, flags[i].r);
      }
    }
    for (i = 0; i < reds.length; i++) {
      reach = floodFrom(g, player.c, player.r);
      if (!reach[reds[i].r][reds[i].c]) carve(g, player.c, player.r, reds[i].c, reds[i].r);
    }

    rocks = [];
    cands = listRoads(g);
    for (i = 0; i < cands.length; i++) {
      p = cands[i];
      if (p.c === player.c && p.r === player.r) continue;
      if (occupied(p.c, p.r, reds) || occupied(p.c, p.r, flags)) continue;
      if (openAround(g, p.c, p.r) < 4) continue;
      if (Math.abs(p.c - player.c) + Math.abs(p.r - player.r) < 4) continue;
      if (rnd() < 0.22 && rocks.length < spec.rocks) {
        g[p.r][p.c] = ROCK;
        reach = floodFrom(g, player.c, player.r);
        var blocked = false;
        var j;
        for (j = 0; j < flags.length; j++) {
          if (!reach[flags[j].r][flags[j].c]) { blocked = true; break; }
        }
        if (!blocked) {
          for (j = 0; j < reds.length; j++) {
            if (!reach[reds[j].r][reds[j].c]) { blocked = true; break; }
          }
        }
        if (blocked) g[p.r][p.c] = ROAD;
        else rocks.push({ c: p.c, r: p.r, x: p.c + 0.5, y: p.r + 0.5 });
      }
    }

    return {
      grid: g,
      player: player,
      reds: reds,
      flags: flags,
      special: extra,
      rocks: rocks,
      fuel: kind === 'hunt' ? Math.round(spec.fuel * 0.9) : spec.fuel
    };
  }

  function idx(c, r) {
    return r * COLS + c;
  }

  function bfsStep(sc, sr, tc, tr) {
    var qh = 0;
    var qt = 0;
    var s = idx(sc, sr);
    var cur, c, r, i, nc, nr, ni, found, step, fc, fr;
    var dxy = [[0, -1], [-1, 0], [0, 1], [1, 0]];
    bfsMark += 1;
    if (bfsMark > 0x3fffffff) {
      bfsSeen.fill(0);
      bfsMark = 1;
    }
    bfsQ[qt++] = s;
    bfsSeen[s] = bfsMark;
    bfsPrev[s] = -1;
    found = -1;
    while (qh < qt) {
      cur = bfsQ[qh++];
      c = cur % COLS;
      r = (cur / COLS) | 0;
      if (c === tc && r === tr) {
        found = cur;
        break;
      }
      for (i = 0; i < 4; i++) {
        nc = c + dxy[i][0];
        nr = r + dxy[i][1];
        if (!inb(nc, nr) || !redWalk(nc, nr)) continue;
        ni = idx(nc, nr);
        if (bfsSeen[ni] === bfsMark) continue;
        bfsSeen[ni] = bfsMark;
        bfsPrev[ni] = cur;
        bfsQ[qt++] = ni;
      }
    }
    if (found < 0) return null;
    step = found;
    while (bfsPrev[step] >= 0 && bfsPrev[step] !== s) step = bfsPrev[step];
    if (bfsPrev[step] < 0) return null;
    fc = step % COLS;
    fr = (step / COLS) | 0;
    return { x: fc - sc, y: fr - sr };
  }

  function dirFromDelta(dx, dy) {
    if (dx === 1) return 'right';
    if (dx === -1) return 'left';
    if (dy === 1) return 'down';
    if (dy === -1) return 'up';
    return null;
  }

  function validDirs(c, r, walkFn, noRev, cur) {
    var out = [];
    var i, name, d;
    for (i = 0; i < DIR_ORDER.length; i++) {
      name = DIR_ORDER[i];
      if (noRev && cur && name === OPP[cur]) continue;
      d = DIRS[name];
      if (walkFn(c + d.x, r + d.y)) out.push(name);
    }
    if (!out.length && cur) {
      d = DIRS[OPP[cur]];
      if (d && walkFn(c + d.x, r + d.y)) out.push(OPP[cur]);
    }
    return out;
  }

  /* ---- entities ---- */
  function makeCar(x, y, dir, kind) {
    return {
      x: x,
      y: y,
      dir: dir,
      want: dir,
      kind: kind,
      smoked: 0,
      daze: 0,
      squash: 0,
      ang: DIR_ANG[dir],
      _at: ''
    };
  }

  function loadLevel(fresh, quiet) {
    var spec = STAGES[G.level - 1] || STAGES[0];
    var seed = G.level * 9176 + (G.kind === 'hunt' ? 41 : 7);
    var built = makeLevel(spec, G.kind, seed);
    var i, e, dir;
    G.grid = built.grid;
    G.rocks = built.rocks;
    G.name = spec.name;
    G.fuelMax = built.fuel;
    G.fuel = built.fuel;
    G.stallT = 0;
    G.flagMul = 1;
    G.flagsGot = 0;
    G.combo = 0;
    G.comboT = 0;
    G.smokes = [];
    G.spawn = { x: built.player.c + 0.5, y: built.player.r + 0.5 };
    G.car = makeCar(G.spawn.x, G.spawn.y, 'right', 'player');
    G.flags = [];
    for (i = 0; i < built.flags.length; i++) {
      G.flags.push({
        c: built.flags[i].c,
        r: built.flags[i].r,
        x: built.flags[i].c + 0.5,
        y: built.flags[i].r + 0.5,
        special: i === built.special,
        taken: false
      });
    }
    G.flagsTotal = G.flags.length;
    G.reds = [];
    for (i = 0; i < built.reds.length; i++) {
      e = built.reds[i];
      dir = e.c > COLS / 2 ? 'left' : 'right';
      G.reds.push(makeCar(e.c + 0.5, e.r + 0.5, dir, 'red'));
    }
    G.redSpawns = built.reds;
    G.camX = G.car.x - 8;
    G.camY = G.car.y - 6;
    G.invuln = 1.35;
    G.screen = quiet ? 'title' : 'ready';
    G.readyT = quiet ? 0 : READY_SEC;
    G.stop = 0;
    particles.length = 0;
    pops.length = 0;
    if (fresh) {
      G.extra = G.score >= EXTRA_LIFE;
    }
    if (!quiet) {
      toast(spec.name, 900, 'gold');
      hintEl.textContent = spec.name + ' · 收 ' + G.flagsTotal + ' 面旗 · 空格烟幕';
    }
    paintHud(true);
  }

  function startGame(kind) {
    audio.start();
    G.kind = kind;
    G.level = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.newBest = false;
    G.extra = false;
    G.clock = 0;
    hideOverlay();
    loadLevel(true);
    canvas.focus();
  }

  function retry() {
    audio.ui();
    if (G.screen === 'title') startGame('tour');
    else startGame(G.kind || 'tour');
  }

  function backToModes() {
    audio.ui();
    G.screen = 'title';
    showOverlay('title');
    paintHud(true);
  }

  function overlayOpen() {
    return overlay && !overlay.classList.contains('hidden');
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
    overlay.classList.remove('end');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function showOverlay(kind) {
    var win = kind === 'win';
    var lose = kind === 'over';
    var title = kind === 'title';
    overlay.classList.remove('hidden');
    overlay.classList.toggle('end', !title);
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', win);
    panel.classList.toggle('lose', lose);
    ovStart.classList.toggle('gone', !title);
    ovEnd.classList.toggle('gone', title);
    ovKicker.textContent = 'RALLY';
    ovOps.textContent = OPS;
    if (title) {
      ovTitle.textContent = '迷宫车';
      ovLead.textContent = '绕开红车去收旗。空格喷烟幕，拖慢追兵。';
    } else if (win) {
      ovTitle.textContent = G.kind === 'hunt' ? '追击完结' : '巡回完结';
      ovLead.textContent = (G.newBest ? '新纪录 ' : '分数 ') + G.score + ' · 全旗收完。';
    } else {
      ovTitle.textContent = '全灭';
      ovLead.textContent = (G.newBest ? '新纪录 ' : '分数 ') + G.score + ' · 红车或岩石，或油尽。';
    }
  }

  function overlayPrimary() {
    if (!overlayOpen()) return;
    if (G.screen === 'title') startGame('tour');
    else if (G.screen === 'over' || G.screen === 'win') startGame(G.kind);
  }

  /* ---- movement ---- */
  function playerSpeed() {
    var sp = 6.15 * (G.kind === 'hunt' ? 1.05 : 1) * (1 + (G.level - 1) * 0.028);
    if (G.fuel <= 0) sp *= 0.34;
    else if (G.fuel < 12) sp *= 0.72;
    return sp;
  }
  function redSpeed(e) {
    var sp = (G.kind === 'hunt' ? 4.42 : 3.62) + (G.level - 1) * 0.2;
    if (e.smoked > 0) sp *= 0.28;
    else if (e.daze > 0) sp *= 0.55;
    return sp;
  }

  function moveEnt(ent, dt, speed, walkFn) {
    var d = DIRS[ent.dir];
    var t, nx, ny, blocked, nextC, nextR, toCenter;
    t = tileOf(ent.x, ent.y);
    nextC = t.c + d.x;
    nextR = t.r + d.y;
    blocked = !walkFn(nextC, nextR);
    if (blocked) {
      if (d.x !== 0) toCenter = (t.c + 0.5 - ent.x) * d.x;
      else toCenter = (t.r + 0.5 - ent.y) * d.y;
      if (toCenter <= 0.02) {
        snapCenter(ent);
        return 0;
      }
      speed = Math.min(speed, toCenter / Math.max(dt, 0.0001));
    }
    nx = ent.x + d.x * speed * dt;
    ny = ent.y + d.y * speed * dt;
    ent.x = nx;
    ent.y = ny;
    return speed;
  }

  function tryTurn(ent, walkFn) {
    var want = ent.want;
    var t, d, cx, cy, along, cross, cur;
    if (!want || want === ent.dir) return;
    if (want === OPP[ent.dir]) {
      t = tileOf(ent.x, ent.y);
      d = DIRS[want];
      if (walkFn(t.c + d.x, t.r + d.y)) ent.dir = want;
      return;
    }
    t = tileOf(ent.x, ent.y);
    d = DIRS[want];
    if (!walkFn(t.c + d.x, t.r + d.y)) return;
    cx = t.c + 0.5;
    cy = t.r + 0.5;
    cur = DIRS[ent.dir];
    if (cur.x !== 0) {
      along = Math.abs(ent.x - cx);
      cross = Math.abs(ent.y - cy);
    } else {
      along = Math.abs(ent.y - cy);
      cross = Math.abs(ent.x - cx);
    }
    if (along > TURN_PRE || cross > 0.22) return;
    if (d.x !== 0) ent.y = cy;
    else ent.x = cx;
    ent.dir = want;
  }

  function heldDir() {
    if (keys.u) return 'up';
    if (keys.d) return 'down';
    if (keys.l) return 'left';
    if (keys.r) return 'right';
    return null;
  }

  function inSmoke(ent) {
    var i, s, dx, dy, rr;
    for (i = 0; i < G.smokes.length; i++) {
      s = G.smokes[i];
      dx = ent.x - s.x;
      dy = ent.y - s.y;
      rr = s.r + 0.28;
      if (dx * dx + dy * dy <= rr * rr) return true;
    }
    return false;
  }

  function pickRedDir(e) {
    var t = tileOf(e.x, e.y);
    var pt = tileOf(G.car.x, G.car.y);
    var choices, step, name, i;
    if (e.smoked > 0) {
      choices = validDirs(t.c, t.r, redWalk, true, e.dir);
      if (!choices.length) choices = validDirs(t.c, t.r, redWalk, false, e.dir);
      return choices.length ? choices[(Math.random() * choices.length) | 0] : e.dir;
    }
    step = bfsStep(t.c, t.r, pt.c, pt.r);
    if (step) {
      name = dirFromDelta(step.x, step.y);
      if (name && redWalk(t.c + step.x, t.r + step.y)) {
        if (name !== OPP[e.dir] || e.daze > 0) return name;
      }
    }
    choices = validDirs(t.c, t.r, redWalk, true, e.dir);
    if (!choices.length) choices = validDirs(t.c, t.r, redWalk, false, e.dir);
    if (!choices.length) return e.dir;
    /* greedy fallback */
    var best = choices[0];
    var bestD = 1e9;
    var d, nx, ny, dist;
    for (i = 0; i < choices.length; i++) {
      d = DIRS[choices[i]];
      nx = t.c + d.x + 0.5;
      ny = t.r + d.y + 0.5;
      dist = (nx - G.car.x) * (nx - G.car.x) + (ny - G.car.y) * (ny - G.car.y);
      if (dist < bestD) {
        bestD = dist;
        best = choices[i];
      }
    }
    return best;
  }

  function dropSmoke() {
    var d, puff;
    audio.ensure();
    if (G.screen !== 'play') return;
    if (G.fuel < 6) {
      audio.deny();
      toast('油不够', 700, 'warn');
      return;
    }
    d = DIRS[G.car.dir];
    if (G.smokes.length >= 6) G.smokes.shift();
    G.fuel = Math.max(0, G.fuel - 7.6);
    puff = {
      x: G.car.x - d.x * 0.9,
      y: G.car.y - d.y * 0.9,
      life: 2.4,
      max: 2.4,
      r: 0.42
    };
    G.smokes.push(puff);
    G.car.squash = 0.28;
    burst(puff.x, puff.y, 18, SMOKEC, 2.4, 0.55, -0.4);
    burst(puff.x, puff.y, 8, CYAN, 1.4, 0.35, -0.2);
    audio.smoke();
    punchStage('eat');
    paintHud(false);
  }

  function nearestFlag() {
    var i, f, best = null, bestD = 1e9, d;
    for (i = 0; i < G.flags.length; i++) {
      f = G.flags[i];
      if (f.taken) continue;
      d = dist2(G.car, f);
      if (d < bestD) {
        bestD = d;
        best = f;
      }
    }
    return best;
  }

  function collectFlag(f) {
    var n, pts, bonus;
    f.taken = true;
    G.flagsGot += 1;
    if (G.comboT > 0) G.combo += 1;
    else G.combo = 1;
    G.comboT = 2.55;
    n = G.flagsGot;
    pts = 100 * n * G.combo * G.flagMul;
    if (f.special) {
      bonus = Math.floor(G.fuel) * 18;
      G.flagMul = 2;
      pts += 400 + bonus;
      audio.special();
      hitStop(0.055);
      kick(5);
      screenFlash(GOLD, 0.45);
      burst(f.x, f.y, 28, GOLD, 4.2, 0.7, 1.4);
      burst(f.x, f.y, 14, AMBER, 3.2, 0.55, 1.2);
      addPop(f.x, f.y - 0.2, '幸运', GOLD, 1.35);
      toast('幸运旗 +' + (400 + bonus), 1100, 'gold');
    } else {
      audio.flag(Math.min(8, G.combo + n));
      hitStop(0.03);
      kick(2.4);
      burst(f.x, f.y, 16, CYAN, 3.4, 0.5, 1.6);
      burst(f.x, f.y, 8, GOLD, 2.4, 0.4, 1.2);
    }
    addScore(pts, f.x, f.y, true);
    if (G.combo >= 2) {
      showChain(G.combo);
      comboBox.classList.remove('hot');
      void comboBox.offsetWidth;
      comboBox.classList.add('hot');
    }
    punchStage('eat');
    if (G.flagsGot >= G.flagsTotal) stageClear();
  }

  function stageClear() {
    var bonus;
    if (G.screen !== 'play') return;
    G.screen = 'clear';
    G.clearT = CLEAR_SEC;
    bonus = Math.max(0, Math.floor(G.fuel * 10));
    if (bonus) addScore(bonus, G.car.x, G.car.y, true);
    audio.clear();
    hitStop(0.08);
    kick(6);
    screenFlash(GOLD, 0.4);
    burst(G.car.x, G.car.y, 36, GOLD, 5, 0.8, 2);
    toast(G.level >= STAGES.length ? '全旗收完' : '过关', 1200, 'gold');
    punchStage('win-flash');
  }

  function die(reason) {
    if (G.screen !== 'play') return;
    if (reason !== 'fuel' && G.invuln > 0) return;
    G.screen = 'crash';
    G.crashT = CRASH_SEC;
    G.lives -= 1;
    hitStop(0.07);
    kick(11);
    screenFlash(MAG, 0.55);
    burst(G.car.x, G.car.y, 34, MAG, 5.5, 0.7, 2.4);
    burst(G.car.x, G.car.y, 18, AMBER, 4.2, 0.55, 1.8);
    burst(G.car.x, G.car.y, 10, GOLD, 3, 0.4, 1.2);
    if (reason === 'fuel') audio.stall();
    else audio.crash();
    toast(reason === 'fuel' ? '没油了' : reason === 'rock' ? '撞岩了' : '撞车了', 900, 'warn');
    punchStage('die');
    persistBest();
    paintHud(true);
  }

  function respawn() {
    G.car.x = G.spawn.x;
    G.car.y = G.spawn.y;
    G.car.dir = 'right';
    G.car.want = 'right';
    G.car.squash = 0;
    G.fuel = G.fuelMax;
    G.stallT = 0;
    G.invuln = 1.35;
    G.smokes = [];
    resetReds();
    G.screen = 'ready';
    G.readyT = READY_SEC;
    toast('预备', 700);
    paintHud(true);
  }

  function resetReds() {
    var i, e, dir, spawns = G.redSpawns || [];
    G.reds = [];
    for (i = 0; i < spawns.length; i++) {
      e = spawns[i];
      dir = e.c > COLS / 2 ? 'left' : 'right';
      G.reds.push(makeCar(e.c + 0.5, e.r + 0.5, dir, 'red'));
    }
  }

  function nextStage() {
    if (G.level >= STAGES.length) {
      G.screen = 'win';
      persistBest();
      audio.win();
      showOverlay('win');
      paintHud(true);
      return;
    }
    G.level += 1;
    loadLevel(false);
    audio.start();
  }

  function gameOver() {
    G.screen = 'over';
    persistBest();
    audio.over();
    showOverlay('over');
    paintHud(true);
  }

  /* ---- update ---- */
  function updateCam(dt) {
    var look = DIRS[G.car.dir];
    var tx = G.car.x - view.vc * 0.5 + look.x * 1.35;
    var ty = G.car.y - view.vr * 0.5 + look.y * 1.1;
    var k = 1 - Math.pow(0.0008, dt * 60);
    G.camX = lerp(G.camX, tx, k);
    G.camY = lerp(G.camY, ty, k);
    G.camX = clamp(G.camX, 0, Math.max(0, COLS - view.vc));
    G.camY = clamp(G.camY, 0, Math.max(0, ROWS - view.vr));
  }

  function updatePlayer(dt) {
    var hd, t, moved, dust;
    hd = heldDir();
    if (hd) G.car.want = hd;
    if (G.car.squash > 0) G.car.squash = Math.max(0, G.car.squash - dt * 3.2);
    G.car.ang = lerpAng(G.car.ang, DIR_ANG[G.car.dir], 1 - Math.pow(0.0002, dt * 60));
    tryTurn(G.car, playerWalk);
    moved = moveEnt(G.car, dt, playerSpeed(), playerWalk);
    if (moved > 0.2 && Math.random() < dt * 18) {
      dust = DIRS[G.car.dir];
      particles.push({
        x: G.car.x - dust.x * 0.35 + rand(-0.12, 0.12),
        y: G.car.y - dust.y * 0.35 + rand(-0.12, 0.12),
        vx: -dust.x * rand(0.4, 1.2) + rand(-0.4, 0.4),
        vy: -dust.y * rand(0.4, 1.2) + rand(-0.4, 0.4),
        r: rand(0.04, 0.09),
        life: rand(0.18, 0.34),
        max: 0.34,
        rgb: AMBER,
        g: -0.4
      });
    }
    t = tileOf(G.car.x, G.car.y);
    if (isRock(t.c, t.r)) {
      var dx = G.car.x - (t.c + 0.5);
      var dy = G.car.y - (t.r + 0.5);
      if (dx * dx + dy * dy < ROCK_R2) die('rock');
    }
  }

  function lerpAng(a, b, t) {
    var d = b - a;
    while (d > Math.PI) d -= TAU;
    while (d < -Math.PI) d += TAU;
    return a + d * t;
  }

  function updateReds(dt) {
    var i, e, t, key, moved;
    for (i = 0; i < G.reds.length; i++) {
      e = G.reds[i];
      if (e.smoked > 0) e.smoked -= dt;
      if (e.daze > 0) e.daze -= dt;
      if (inSmoke(e)) {
        if (e.smoked <= 0) {
          e.smoked = 1.55;
          e.daze = 0.5;
          e.dir = OPP[e.dir] || e.dir;
          audio.daze();
          burst(e.x, e.y, 10, SMOKEC, 2.2, 0.4, -0.2);
          addScore(50, e.x, e.y, true);
        } else e.smoked = Math.max(e.smoked, 0.6);
      }
      if (nearCenter(e, 0.14)) {
        snapCenter(e);
        t = tileOf(e.x, e.y);
        key = t.c + ',' + t.r;
        if (e._at !== key) {
          e._at = key;
          e.dir = pickRedDir(e);
        }
      }
      e.ang = lerpAng(e.ang, DIR_ANG[e.dir], 1 - Math.pow(0.0003, dt * 60));
      moved = moveEnt(e, dt, redSpeed(e), redWalk);
      if (moved === 0 && nearCenter(e, 0.2)) {
        e._at = '';
        e.dir = pickRedDir(e);
      }
    }
  }

  function updateSmoke(dt) {
    var i, s;
    for (i = G.smokes.length - 1; i >= 0; i--) {
      s = G.smokes[i];
      s.life -= dt;
      s.r = lerp(0.42, 1.35, 1 - s.life / s.max);
      if (s.life <= 0) G.smokes.splice(i, 1);
    }
  }

  function checkFlags() {
    var i, f;
    for (i = 0; i < G.flags.length; i++) {
      f = G.flags[i];
      if (f.taken) continue;
      if (dist2(G.car, f) <= FLAG_R2) collectFlag(f);
    }
  }

  function checkCrash() {
    var i, e;
    if (G.invuln > 0) return;
    for (i = 0; i < G.reds.length; i++) {
      e = G.reds[i];
      if (dist2(G.car, e) <= HIT_R2) {
        die('red');
        return;
      }
    }
  }

  function updateParticles(dt) {
    var i, p;
    for (i = particles.length - 1; i >= 0; i--) {
      p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (i = pops.length - 1; i >= 0; i--) {
      pops[i].life -= dt;
      pops[i].y -= dt * 0.7;
      if (pops[i].life <= 0) pops.splice(i, 1);
    }
  }

  function drainFuel(dt) {
    var rate = G.kind === 'hunt' ? 2.55 : 2.12;
    if (G.fuel > 0) {
      G.fuel -= rate * dt;
      if (G.fuel < 0) G.fuel = 0;
      G.stallT = 0;
    } else {
      G.stallT += dt;
      if (G.stallT > 2.35) die('fuel');
    }
    if (G.fuel > 0 && G.fuel < 16) {
      G.warnT -= dt;
      if (G.warnT <= 0) {
        G.warnT = 0.72;
        audio.warn();
        if (G.fuel < 8) toast('油少', 500, 'warn');
      }
    }
  }

  function tick(dt) {
    G.shake *= Math.pow(0.0008, dt * 60);
    if (G.shake < 0.04) G.shake = 0;
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) G.combo = 0;
    }
    if (G.stop > 0) {
      G.stop -= dt;
      updateParticles(dt * 0.35);
      return;
    }
    G.clock += dt;
    if (G.screen === 'title' || G.screen === 'over' || G.screen === 'win') {
      if (G.grid && G.car) {
        G.camX = G.car.x - view.vc * 0.5 + Math.sin(G.clock * 0.22) * 1.5;
        G.camY = G.car.y - view.vr * 0.5 + Math.cos(G.clock * 0.17) * 1.1;
        G.camX = clamp(G.camX, 0, Math.max(0, COLS - view.vc));
        G.camY = clamp(G.camY, 0, Math.max(0, ROWS - view.vr));
      }
      updateParticles(dt);
      return;
    }
    if (G.screen === 'play' && G.invuln > 0) G.invuln -= dt;
    if (G.screen === 'ready') {
      G.readyT -= dt;
      updateCam(dt);
      if (G.readyT <= 0) {
        G.screen = 'play';
        toast('出发', 600, 'gold');
      }
      return;
    }
    if (G.screen === 'crash') {
      G.crashT -= dt;
      updateParticles(dt);
      updateSmoke(dt);
      if (G.crashT <= 0) {
        if (G.lives <= 0) gameOver();
        else respawn();
      }
      return;
    }
    if (G.screen === 'clear') {
      G.clearT -= dt;
      updateParticles(dt);
      if (G.clearT <= 0) nextStage();
      return;
    }
    drainFuel(dt);
    if (G.screen === 'play') updatePlayer(dt);
    if (G.screen === 'play') updateReds(dt);
    updateSmoke(dt);
    if (G.screen === 'play') checkFlags();
    if (G.screen === 'play') checkCrash();
    updateCam(dt);
    updateParticles(dt);
    if (Math.random() < dt * 10) capArr(particles, 460);
  }

  /* ---- draw ---- */
  function worldX(x) {
    return view.ox + (x - G.camX) * view.tile;
  }
  function worldY(y) {
    return view.oy + (y - G.camY) * view.tile;
  }

  function rr(c, x, y, w, h, r) {
    var rad = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rad, y);
    c.arcTo(x + w, y, x + w, y + h, rad);
    c.arcTo(x + w, y + h, x, y + h, rad);
    c.arcTo(x, y + h, x, y, rad);
    c.arcTo(x, y, x + w, y, rad);
    c.closePath();
  }

  function drawMaze(c, s) {
    var c0 = Math.max(0, (G.camX | 0) - 1);
    var r0 = Math.max(0, (G.camY | 0) - 1);
    var c1 = Math.min(COLS - 1, ((G.camX + view.vc) | 0) + 1);
    var r1 = Math.min(ROWS - 1, ((G.camY + view.vr) | 0) + 1);
    var col, row, t, x, y, night;
    night = G.level >= 5;
    c.fillStyle = night ? '#0c060a' : '#14080c';
    c.fillRect(worldX(c0), worldY(r0), (c1 - c0 + 1) * s, (r1 - r0 + 1) * s);
    for (row = r0; row <= r1; row++) {
      for (col = c0; col <= c1; col++) {
        t = cell(col, row);
        x = worldX(col);
        y = worldY(row);
        if (t === WALL) {
          c.fillStyle = night ? '#1c0c12' : '#241018';
          c.fillRect(x, y, s + 0.5, s + 0.5);
        } else {
          if (((col + row) & 1) === 0) {
            c.fillStyle = night ? 'rgba(255,154,50,0.035)' : 'rgba(255,154,50,0.05)';
            c.fillRect(x, y, s, s);
          }
        }
      }
    }
    c.strokeStyle = 'rgba(255,154,50,0.72)';
    c.lineWidth = Math.max(1.2, s * 0.08);
    c.lineJoin = 'round';
    for (row = r0; row <= r1; row++) {
      for (col = c0; col <= c1; col++) {
        if (cell(col, row) !== WALL) continue;
        x = worldX(col);
        y = worldY(row);
        c.beginPath();
        if (cell(col, row - 1) !== WALL) {
          c.moveTo(x, y + 0.8);
          c.lineTo(x + s, y + 0.8);
        }
        if (cell(col, row + 1) !== WALL) {
          c.moveTo(x, y + s - 0.8);
          c.lineTo(x + s, y + s - 0.8);
        }
        if (cell(col - 1, row) !== WALL) {
          c.moveTo(x + 0.8, y);
          c.lineTo(x + 0.8, y + s);
        }
        if (cell(col + 1, row) !== WALL) {
          c.moveTo(x + s - 0.8, y);
          c.lineTo(x + s - 0.8, y + s);
        }
        c.stroke();
      }
    }
  }

  function drawRocks(c, s) {
    var i, rk, x, y, wob;
    for (i = 0; i < G.rocks.length; i++) {
      rk = G.rocks[i];
      x = worldX(rk.x);
      y = worldY(rk.y);
      if (x < -s || y < -s || x > view.mw + s || y > view.h + s) continue;
      wob = s * 0.32;
      c.save();
      c.translate(x, y);
      c.fillStyle = '#2a1a18';
      c.beginPath();
      c.moveTo(-wob, wob * 0.5);
      c.lineTo(-wob * 0.3, -wob);
      c.lineTo(wob * 0.85, -wob * 0.45);
      c.lineTo(wob, wob * 0.7);
      c.lineTo(-wob * 0.15, wob);
      c.closePath();
      c.fill();
      c.strokeStyle = 'rgba(255,154,50,0.55)';
      c.lineWidth = 1.2;
      c.stroke();
      c.fillStyle = 'rgba(255,227,107,0.22)';
      c.beginPath();
      c.arc(-wob * 0.2, -wob * 0.25, wob * 0.22, 0, TAU);
      c.fill();
      c.restore();
    }
  }

  function drawFlags(c, s) {
    var i, f, x, y, wave, pole;
    for (i = 0; i < G.flags.length; i++) {
      f = G.flags[i];
      if (f.taken) continue;
      x = worldX(f.x);
      y = worldY(f.y);
      if (x < -s || y < -s || x > view.mw + s || y > view.h + s) continue;
      wave = Math.sin(G.clock * 6 + f.c) * 0.18;
      pole = s * 0.42;
      c.save();
      c.translate(x, y);
      c.strokeStyle = '#e8dcc8';
      c.lineWidth = Math.max(1.4, s * 0.07);
      c.beginPath();
      c.moveTo(0, pole * 0.7);
      c.lineTo(0, -pole);
      c.stroke();
      c.fillStyle = f.special ? rgba(GOLD, 0.95) : rgba(CYAN, 0.95);
      c.beginPath();
      c.moveTo(0, -pole);
      c.lineTo(s * (0.38 + wave), -pole + s * 0.1);
      c.lineTo(0, -pole + s * 0.28);
      c.closePath();
      c.fill();
      if (f.special) {
        c.fillStyle = rgba(GOLD, 0.35 + Math.sin(G.clock * 8) * 0.2);
        c.beginPath();
        c.arc(0, -pole * 0.2, s * 0.28, 0, TAU);
        c.fill();
      }
      c.restore();
    }
  }

  function drawSmokes(c, s) {
    var i, p, x, y, a, rad, j;
    for (i = 0; i < G.smokes.length; i++) {
      p = G.smokes[i];
      x = worldX(p.x);
      y = worldY(p.y);
      a = clamp(p.life / p.max, 0, 1);
      rad = p.r * s;
      for (j = 0; j < 3; j++) {
        c.fillStyle = 'rgba(210,228,236,' + (0.14 * a * (1 - j * 0.22)) + ')';
        c.beginPath();
        c.arc(x + Math.sin(G.clock * 3 + j) * s * 0.08, y + Math.cos(G.clock * 2.4 + j) * s * 0.07, rad * (0.7 + j * 0.18), 0, TAU);
        c.fill();
      }
    }
  }

  function drawCar(c, s, ent, isPlayer) {
    var x = worldX(ent.x);
    var y = worldY(ent.y);
    var blink = isPlayer && G.invuln > 0 && ((G.clock * 16) | 0) % 2 === 0;
    var smoked = !isPlayer && ent.smoked > 0;
    var body, glass, w, h;
    if (blink) return;
    if (G.screen === 'crash' && isPlayer) {
      if (G.crashT < 0.45 && ((G.clock * 20) | 0) % 2 === 0) return;
    }
    c.save();
    c.translate(x, y);
    c.rotate(ent.ang);
    if (isPlayer && ent.squash > 0 && !reduceMotion()) {
      c.scale(1 + ent.squash * 0.25, 1 - ent.squash * 0.28);
    }
    w = s * 0.74;
    h = s * 0.46;
    c.fillStyle = 'rgba(0,0,0,0.32)';
    rr(c, -w / 2 + 1, -h / 2 + 2, w, h, 4);
    c.fill();
    body = isPlayer ? '#ffe36b' : smoked ? '#c07080' : '#ff3a48';
    glass = isPlayer ? '#7af6ff' : '#2a1018';
    c.fillStyle = body;
    rr(c, -w / 2, -h / 2, w, h, 5);
    c.fill();
    c.strokeStyle = isPlayer ? 'rgba(255,154,50,0.7)' : 'rgba(255,220,220,0.35)';
    c.lineWidth = 1.1;
    c.stroke();
    c.fillStyle = glass;
    rr(c, w * 0.02, -h * 0.28, w * 0.28, h * 0.56, 2);
    c.fill();
    c.fillStyle = isPlayer ? '#ff5a32' : '#ffe36b';
    c.fillRect(w / 2 - 3, -h * 0.28, 3, 4);
    c.fillRect(w / 2 - 3, h * 0.12, 3, 4);
    c.fillStyle = '#1a1010';
    c.fillRect(-w * 0.28, -h / 2 - 2, w * 0.22, 3);
    c.fillRect(-w * 0.28, h / 2 - 1, w * 0.22, 3);
    if (isPlayer) {
      c.fillStyle = 'rgba(255,227,107,0.55)';
      c.beginPath();
      c.moveTo(w / 2, -3);
      c.lineTo(w / 2 + s * 0.28, -8);
      c.lineTo(w / 2 + s * 0.28, 8);
      c.closePath();
      c.fill();
    }
    c.restore();
  }

  function drawFx(c, s) {
    var i, p, a, x, y;
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      a = clamp(p.life / p.max, 0, 1);
      x = worldX(p.x);
      y = worldY(p.y);
      c.fillStyle = rgba(p.rgb, a);
      c.beginPath();
      c.arc(x, y, Math.max(1.2, p.r * s * (0.6 + a * 0.6)), 0, TAU);
      c.fill();
    }
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (i = 0; i < pops.length; i++) {
      p = pops[i];
      a = clamp(p.life / p.max, 0, 1);
      c.font = '800 ' + Math.round(s * 0.42 * p.scale) + 'px "Segoe UI","PingFang SC",sans-serif';
      c.fillStyle = rgba(p.rgb, a);
      c.fillText(p.text, worldX(p.x), worldY(p.y));
    }
  }

  function drawGo(c, s) {
    var f = nearestFlag();
    var x, y, dx, dy, ang, px, py, edge;
    if (!f || G.screen === 'title') return;
    x = worldX(f.x);
    y = worldY(f.y);
    if (x > view.ox + 18 && y > view.oy + 18 && x < view.ox + view.mw - 18 && y < view.oy + view.mh - 18) return;
    px = clamp(x, view.ox + 22, view.ox + view.mw - 22);
    py = clamp(y, view.oy + 22, view.oy + view.mh - 22);
    dx = f.x - G.car.x;
    dy = f.y - G.car.y;
    ang = Math.atan2(dy, dx);
    edge = 0.55 + Math.sin(G.clock * 8) * 0.12;
    c.save();
    c.translate(px, py);
    c.rotate(ang);
    c.fillStyle = rgba(CYAN, 0.85);
    c.beginPath();
    c.moveTo(12, 0);
    c.lineTo(-8, -9);
    c.lineTo(-4, 0);
    c.lineTo(-8, 9);
    c.closePath();
    c.fill();
    c.font = '800 10px "Segoe UI","PingFang SC",sans-serif';
    c.fillStyle = rgba(GOLD, edge);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.rotate(-ang);
    c.fillText('旗', 0, -16);
    c.restore();
  }

  function drawBanner(c, s) {
    var msg = '';
    if (G.screen === 'ready') msg = G.readyT > READY_SEC * 0.45 ? '预备' : '出发';
    else if (G.screen === 'crash') msg = G.lives <= 0 ? '' : '撞车了';
    else if (G.screen === 'clear') msg = G.level >= STAGES.length ? '全旗收完' : '过关';
    if (!msg) return;
    c.save();
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = '800 ' + Math.round(s * 1.15) + 'px "Segoe UI","PingFang SC",sans-serif';
    c.fillStyle = '#ffe36b';
    c.shadowColor = 'rgba(255,154,50,0.7)';
    c.shadowBlur = 16;
    c.fillText(msg, view.ox + view.mw / 2, view.oy + view.mh / 2);
    c.restore();
  }

  function drawRadar(c) {
    var rw, rh, ox, oy, cs, col, row, i, f, e, px, py, fuelH;
    rw = view.radar;
    rh = rw * (ROWS / COLS);
    if (view.side) {
      ox = view.w - rw - 10;
      oy = 12;
    } else {
      ox = view.w - rw - 8;
      oy = 8;
    }
    cs = rw / COLS;
    c.save();
    c.globalAlpha = view.side ? 1 : 0.92;
    rr(c, ox - 8, oy - 8, rw + 16, rh + 52, 12);
    c.fillStyle = 'rgba(10,5,8,0.78)';
    c.fill();
    c.strokeStyle = 'rgba(255,154,50,0.4)';
    c.lineWidth = 1;
    c.stroke();
    c.fillStyle = '#1a1014';
    c.fillRect(ox, oy, rw, rh);
    c.fillStyle = 'rgba(255,154,50,0.55)';
    for (row = 0; row < ROWS; row++) {
      for (col = 0; col < COLS; col++) {
        if (cell(col, row) === WALL) c.fillRect(ox + col * cs, oy + row * cs, cs + 0.4, cs + 0.4);
      }
    }
    c.fillStyle = '#a87858';
    for (i = 0; i < G.rocks.length; i++) {
      c.fillRect(ox + G.rocks[i].c * cs, oy + G.rocks[i].r * cs, cs, cs);
    }
    for (i = 0; i < G.flags.length; i++) {
      f = G.flags[i];
      if (f.taken) continue;
      c.fillStyle = f.special ? '#ffe36b' : '#00f0ff';
      c.beginPath();
      c.arc(ox + f.x * cs, oy + f.y * cs, Math.max(1.6, cs * 0.9), 0, TAU);
      c.fill();
    }
    for (i = 0; i < G.reds.length; i++) {
      e = G.reds[i];
      c.fillStyle = e.smoked > 0 ? '#c09098' : '#ff3a48';
      c.fillRect(ox + e.x * cs - 1.4, oy + e.y * cs - 1.4, 2.8, 2.8);
    }
    if (G.car) {
      px = ox + G.car.x * cs;
      py = oy + G.car.y * cs;
      c.fillStyle = '#ffe36b';
      c.beginPath();
      c.arc(px, py, 2.4, 0, TAU);
      c.fill();
    }
    c.fillStyle = '#a89488';
    c.font = '700 10px "Segoe UI","PingFang SC",sans-serif';
    c.textAlign = 'left';
    c.fillText('雷达', ox, oy + rh + 14);
    c.fillStyle = '#5a4038';
    rr(c, ox, oy + rh + 20, rw, 8, 4);
    c.fill();
    fuelH = clamp(G.fuel / Math.max(1, G.fuelMax), 0, 1);
    c.fillStyle = fuelH < 0.18 ? '#ff3db8' : fuelH < 0.4 ? '#ffe36b' : '#ff9a32';
    rr(c, ox, oy + rh + 20, rw * fuelH, 8, 4);
    c.fill();
    c.restore();
  }

  function render() {
    var dpr = view.dpr;
    var s = view.tile;
    var w = view.w;
    var h = view.h;
    var shx = 0;
    var shy = 0;
    var i;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#080308';
    ctx.fillRect(0, 0, w, h);
    if (G.shake > 0 && !reduceMotion()) {
      shx = (Math.random() - 0.5) * G.shake;
      shy = (Math.random() - 0.5) * G.shake;
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, view.mw, h);
    ctx.clip();
    ctx.translate(shx, shy);
    if (G.grid) {
      drawMaze(ctx, s);
      drawRocks(ctx, s);
      drawSmokes(ctx, s);
      drawFlags(ctx, s);
      for (i = 0; i < G.reds.length; i++) drawCar(ctx, s, G.reds[i], false);
      if (G.car && (G.screen !== 'crash' || G.crashT > 0)) drawCar(ctx, s, G.car, true);
      drawFx(ctx, s);
      drawGo(ctx, s);
      if (G.flash > 0) {
        ctx.fillStyle = rgba(G.flashRgb, G.flash);
        ctx.fillRect(view.ox - 20, view.oy - 20, view.mw + 40, view.mh + 40);
      }
      drawBanner(ctx, s);
    }
    ctx.restore();
    if (G.grid && G.screen !== 'title') drawRadar(ctx);
  }

  function resize() {
    var wrap = canvas.parentElement;
    var rect = wrap.getBoundingClientRect();
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.max(1, rect.width);
    var h = Math.max(1, rect.height);
    var side = w >= 560;
    var radar = side ? Math.round(Math.min(120, Math.max(88, w * 0.19))) : Math.min(96, w * 0.3);
    var mw = side ? w - radar - 14 : w;
    var tile = Math.min(mw / 15.2, h / 11.6);
    tile = clamp(tile, 14, 42);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    view.w = w;
    view.h = h;
    view.dpr = dpr;
    view.tile = tile;
    view.mw = mw;
    view.mh = h;
    view.side = side;
    view.radar = radar;
    view.vc = mw / tile;
    view.vr = h / tile;
    view.ox = 0;
    view.oy = 0;
  }

  /* ---- hud ---- */
  function paintPips() {
    var html = '';
    var i;
    for (i = 0; i < LIVES; i++) {
      html += '<i class="pip ' + (i < G.lives ? 'on' : 'gone') + '"></i>';
    }
    if (G.lives > LIVES) {
      for (i = LIVES; i < G.lives; i++) html += '<i class="pip on"></i>';
    }
    pipsEl.innerHTML = html;
  }

  function paintHud(force) {
    var fuelN = Math.round(G.fuel);
    var flagsLeft = G.flagsTotal - G.flagsGot;
    if (force || hud.score !== G.score) {
      hud.score = G.score;
      scoreEl.textContent = String(G.score);
    }
    if (force || hud.best !== G.best) {
      hud.best = G.best;
      bestEl.textContent = String(G.best);
    }
    if (force || hud.level !== G.level) {
      hud.level = G.level;
      levelEl.textContent = String(G.level);
    }
    if (force || hud.combo !== G.combo) {
      hud.combo = G.combo;
      comboEl.textContent = '×' + Math.max(1, G.combo);
      comboBox.hidden = G.combo < 2;
    }
    if (force || hud.lives !== G.lives) {
      hud.lives = G.lives;
      paintPips();
    }
    if (force || hud.kind !== G.kind) {
      hud.kind = G.kind;
      modeLabel.textContent = G.kind === 'hunt' ? '追击' : '巡回';
      modeLabel.classList.toggle('hunt', G.kind === 'hunt');
    }
    if (force || hud.flags !== flagsLeft || hud.fuel !== fuelN) {
      hud.flags = flagsLeft;
      hud.fuel = fuelN;
      flagLabel.textContent = '旗 ' + G.flagsGot + '/' + G.flagsTotal;
      fuelBar.style.transform = 'scaleX(' + clamp(G.fuel / Math.max(1, G.fuelMax), 0, 1) + ')';
      fuelBar.classList.toggle('low', G.fuel > 0 && G.fuel < 28);
      fuelBar.classList.toggle('critical', G.fuel < 12);
    }
  }

  /* ---- input ---- */
  function wantDir(dir) {
    if (!dir) return;
    audio.ensure();
    if (G.screen === 'title' || G.screen === 'over' || G.screen === 'win') return;
    G.car.want = dir;
  }

  function onKeyDown(e) {
    var dir;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    audio.ensure();
    if (e.code === 'KeyR') {
      e.preventDefault();
      if (!e.repeat) retry();
      return;
    }
    if (e.code === 'KeyM') {
      e.preventDefault();
      audio.setMuted(!audio.muted);
      return;
    }
    if (overlayOpen()) {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (!e.repeat) overlayPrimary();
      }
      if (KEY_DIR[e.code]) e.preventDefault();
      return;
    }
    dir = KEY_DIR[e.code];
    if (dir) {
      e.preventDefault();
      if (dir === 'up') keys.u = true;
      if (dir === 'down') keys.d = true;
      if (dir === 'left') keys.l = true;
      if (dir === 'right') keys.r = true;
      wantDir(dir);
      return;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      if (!e.repeat) dropSmoke();
    }
  }

  function onKeyUp(e) {
    var dir = KEY_DIR[e.code];
    if (!dir) return;
    if (dir === 'up') keys.u = false;
    if (dir === 'down') keys.d = false;
    if (dir === 'left') keys.l = false;
    if (dir === 'right') keys.r = false;
  }

  function swipeDir(dx, dy) {
    if (Math.abs(dx) < SWIPE_MIN && Math.abs(dy) < SWIPE_MIN) return null;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
    return dy > 0 ? 'down' : 'up';
  }

  function onPointerDown(e) {
    audio.ensure();
    if (overlayOpen()) return;
    swipe.on = true;
    swipe.id = e.pointerId;
    swipe.x = e.clientX;
    swipe.y = e.clientY;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  }
  function onPointerMove(e) {
    var dir;
    if (!swipe.on || e.pointerId !== swipe.id) return;
    dir = swipeDir(e.clientX - swipe.x, e.clientY - swipe.y);
    if (dir) {
      wantDir(dir);
      swipe.x = e.clientX;
      swipe.y = e.clientY;
    }
  }
  function onPointerUp(e) {
    if (e.pointerId === swipe.id) swipe.on = false;
  }

  function bindPad(btn, dir) {
    var set = function (on) {
      if (dir === 'up') keys.u = on;
      if (dir === 'down') keys.d = on;
      if (dir === 'left') keys.l = on;
      if (dir === 'right') keys.r = on;
      btn.classList.toggle('held', on);
      if (on) wantDir(dir);
    };
    btn.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      audio.ensure();
      try { btn.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      set(true);
    });
    btn.addEventListener('pointerup', function () { set(false); });
    btn.addEventListener('pointercancel', function () { set(false); });
    btn.addEventListener('pointerleave', function () { set(false); });
  }

  function bindSmokeBtn(btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      audio.ensure();
      dropSmoke();
    });
  }

  /* ---- loop ---- */
  function frame(ts) {
    var dt;
    if (!lastTs) lastTs = ts;
    dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (dt > 0.05) dt = 0.05;
    if (document.hidden) {
      requestAnimationFrame(frame);
      return;
    }
    tick(dt);
    paintHud(false);
    render();
    requestAnimationFrame(frame);
  }

  function bind() {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
    btnRetry.addEventListener('click', retry);
    bindSmokeBtn(btnSmoke);
    bindSmokeBtn(document.getElementById('btn-fire'));
    bindPad(document.getElementById('btn-up'), 'up');
    bindPad(document.getElementById('btn-down'), 'down');
    bindPad(document.getElementById('btn-left'), 'left');
    bindPad(document.getElementById('btn-right'), 'right');
    btnTour.addEventListener('click', function () { startGame('tour'); });
    btnHunt.addEventListener('click', function () { startGame('hunt'); });
    ovRetry.addEventListener('click', function () { startGame(G.kind); });
    ovModes.addEventListener('click', backToModes);
    window.addEventListener('resize', resize);
    if (window.ResizeObserver) {
      new ResizeObserver(resize).observe(canvas.parentElement);
    }
  }

  G.best = loadBest();
  audio.setMuted(loadMute());
  bind();
  resize();
  loadLevel(true, true);
  showOverlay('title');
  paintHud(true);
  requestAnimationFrame(frame);
})();
