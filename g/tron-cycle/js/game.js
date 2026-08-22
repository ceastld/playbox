'use strict';

/* Tron light-cycle remake. Solid trails. Walled or wrap. 3 AI bikes. */

(function () {
  const COLS = 40;
  const ROWS = 28;
  const NORTH = 0;
  const EAST = 1;
  const SOUTH = 2;
  const WEST = 3;
  const DX = [0, 1, 0, -1];
  const DY = [-1, 0, 1, 0];
  const OPP = [2, 3, 0, 1];
  const TAU = Math.PI * 2;
  const LIVES = 3;
  const BASE_MS = 90;
  const FLOOR_MS = 44;
  const MS_PER_ROUND = 6;
  const SWIPE_MIN = 24;
  const KILL_SCORE = 120;
  const WIN_SCORE = 360;
  const WIN_ROUND = 40;
  const BEST_KEY = 'playbox-tron-cycle-best';
  const MUTE_KEY = 'playbox-tron-cycle-mute';
  const KIND_KEY = 'playbox-tron-cycle-kind';
  const OPS = '方向键／WASD 转弯 · 滑动或点格 · R 重开 · M 静音';

  const PAL = [
    { name: '你', rgb: [0, 232, 255] },
    { name: '黄', rgb: [255, 225, 74] },
    { name: '粉', rgb: [255, 61, 184] },
    { name: '橙', rgb: [255, 122, 46] }
  ];

  const KEY_DIR = {
    ArrowLeft: WEST, ArrowRight: EAST, ArrowUp: NORTH, ArrowDown: SOUTH,
    KeyA: WEST, KeyD: EAST, KeyW: NORTH, KeyS: SOUTH
  };

  const hasDom = typeof document !== 'undefined';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const floodSeen = new Uint16Array(COLS * ROWS);
  let floodStamp = 1;
  const floodQ = new Int16Array(COLS * ROWS * 2);

  function gi(c, r) {
    return r * COLS + c;
  }

  function startPos() {
    return [
      { c: 4, r: 10, dir: EAST },
      { c: COLS - 5, r: 17, dir: WEST },
      { c: 14, r: 3, dir: SOUTH },
      { c: 26, r: ROWS - 4, dir: NORTH }
    ];
  }

  function makeBike(id, c, r, dir, ai) {
    return {
      id: id,
      c: c,
      r: r,
      pc: c,
      pr: r,
      dir: dir,
      pending: -1,
      alive: true,
      ai: !!ai,
      jump: false,
      punch: 0,
      crashT: 0
    };
  }

  function freshState(kind) {
    const wrap = kind === 'wrap';
    const grid = new Uint8Array(COLS * ROWS);
    const pos = startPos();
    const bikes = [];
    let i;
    for (i = 0; i < 4; i++) {
      bikes.push(makeBike(i + 1, pos[i].c, pos[i].r, pos[i].dir, i !== 0));
    }
    return {
      kind: kind,
      wrap: wrap,
      grid: grid,
      bikes: bikes,
      tick: 0
    };
  }

  function nextCell(c, r, dir, wrap) {
    let nc = c + DX[dir];
    let nr = r + DY[dir];
    if (wrap) {
      const wrapped = nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS;
      if (nc < 0) nc += COLS;
      else if (nc >= COLS) nc -= COLS;
      if (nr < 0) nr += ROWS;
      else if (nr >= ROWS) nr -= ROWS;
      return { c: nc, r: nr, wrap: wrapped };
    }
    if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) return null;
    return { c: nc, r: nr, wrap: false };
  }

  function aliveCount(st) {
    let n = 0;
    let i;
    for (i = 0; i < st.bikes.length; i++) if (st.bikes[i].alive) n += 1;
    return n;
  }

  function queueTurn(bike, dir) {
    if (!bike || !bike.alive) return false;
    if (dir < 0 || dir > 3) return false;
    if (dir === OPP[bike.dir]) return false;
    if (dir === bike.dir) {
      bike.pending = -1;
      return false;
    }
    bike.pending = dir;
    return true;
  }

  function markBikes(st, extra) {
    extra.fill(0);
    let i, b;
    for (i = 0; i < st.bikes.length; i++) {
      b = st.bikes[i];
      if (!b.alive) continue;
      extra[gi(b.c, b.r)] = b.id;
    }
    return extra;
  }

  function floodArea(grid, sc, sr, wrap, extra) {
    const i0 = gi(sc, sr);
    if (grid[i0] !== 0) return 0;
    if (extra && extra[i0]) return 0;
    floodStamp += 1;
    if (floodStamp === 65535) {
      floodSeen.fill(0);
      floodStamp = 1;
    }
    let head = 0;
    let tail = 0;
    let area = 0;
    floodQ[tail++] = sc;
    floodQ[tail++] = sr;
    floodSeen[i0] = floodStamp;
    while (head < tail) {
      const c = floodQ[head++];
      const r = floodQ[head++];
      area += 1;
      let d, nc, nr, j;
      for (d = 0; d < 4; d++) {
        nc = c + DX[d];
        nr = r + DY[d];
        if (wrap) {
          if (nc < 0) nc += COLS;
          else if (nc >= COLS) nc -= COLS;
          if (nr < 0) nr += ROWS;
          else if (nr >= ROWS) nr -= ROWS;
        } else if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) {
          continue;
        }
        j = gi(nc, nr);
        if (floodSeen[j] === floodStamp) continue;
        if (grid[j] !== 0) continue;
        if (extra && extra[j]) continue;
        floodSeen[j] = floodStamp;
        floodQ[tail++] = nc;
        floodQ[tail++] = nr;
      }
    }
    return area;
  }

  function straightRun(st, c, r, dir, extra) {
    let n = 0;
    let cc = c;
    let rr = r;
    const cap = COLS + ROWS;
    let k, nxt, j;
    for (k = 0; k < cap; k++) {
      nxt = nextCell(cc, rr, dir, st.wrap);
      if (!nxt) break;
      j = gi(nxt.c, nxt.r);
      if (st.grid[j] !== 0) break;
      if (extra && extra[j]) break;
      n += 1;
      cc = nxt.c;
      rr = nxt.r;
    }
    return n;
  }

  function oncoming(st, bike, dir) {
    let c = bike.c;
    let r = bike.r;
    let k, n, i, o;
    for (k = 0; k < 5; k++) {
      n = nextCell(c, r, dir, st.wrap);
      if (!n) return false;
      if (st.grid[gi(n.c, n.r)] !== 0) return false;
      for (i = 0; i < st.bikes.length; i++) {
        o = st.bikes[i];
        if (!o.alive || o.id === bike.id) continue;
        if (o.c === n.c && o.r === n.r && o.dir === OPP[dir]) return true;
      }
      c = n.c;
      r = n.r;
    }
    return false;
  }

  const extraBuf = new Uint8Array(COLS * ROWS);

  function scoreMove(st, bike, dir, extra) {
    const n = nextCell(bike.c, bike.r, dir, st.wrap);
    if (!n) return -1;
    const i = gi(n.c, n.r);
    if (st.grid[i] !== 0) return -1;
    if (extra[i]) return -1;
    const area = floodArea(st.grid, n.c, n.r, st.wrap, extra);
    if (area <= 0) return -1;
    let s = area * 4 + straightRun(st, n.c, n.r, dir, extra);
    if (dir === bike.dir) s += 10;
    if (oncoming(st, bike, dir)) s -= 90;
    return s;
  }

  function thinkBike(st, bike) {
    if (!bike.alive) return;
    markBikes(st, extraBuf);
    const left = (bike.dir + 3) & 3;
    const right = (bike.dir + 1) & 3;
    const opts = [bike.dir, left, right];
    let best = bike.dir;
    let bestS = -1;
    let i, d, s;
    for (i = 0; i < 3; i++) {
      d = opts[i];
      s = scoreMove(st, bike, d, extraBuf);
      if (s > bestS) {
        bestS = s;
        best = d;
      }
    }
    if (bestS < 0) return;
    const straightS = scoreMove(st, bike, bike.dir, extraBuf);
    if (best !== bike.dir && straightS >= 0 && bestS < straightS + 14) {
      best = bike.dir;
    }
    if (best !== bike.dir) queueTurn(bike, best);
  }

  function crashBike(st, bike, reason, events) {
    if (!bike.alive) return;
    bike.alive = false;
    bike.crashT = 1;
    events.crashes.push({
      id: bike.id,
      c: bike.c,
      r: bike.r,
      dir: bike.dir,
      reason: reason
    });
  }

  function stepWorld(st, doThink) {
    const events = { crashes: [], turns: [], wraps: [] };
    const bikes = st.bikes;
    let i, b, n, k, list;
    if (doThink) {
      for (i = 0; i < bikes.length; i++) {
        b = bikes[i];
        if (b.alive && b.ai) thinkBike(st, b);
      }
    }
    for (i = 0; i < bikes.length; i++) {
      b = bikes[i];
      if (!b.alive) continue;
      if (b.pending >= 0 && b.pending !== OPP[b.dir] && b.pending !== b.dir) {
        b.dir = b.pending;
        events.turns.push(b.id);
        b.punch = 1;
      }
      b.pending = -1;
    }

    const nexts = [];
    for (i = 0; i < bikes.length; i++) {
      b = bikes[i];
      if (!b.alive) {
        nexts.push(null);
        continue;
      }
      nexts.push(nextCell(b.c, b.r, b.dir, st.wrap));
    }

    for (i = 0; i < bikes.length; i++) {
      b = bikes[i];
      if (!b.alive) continue;
      st.grid[gi(b.c, b.r)] = b.id;
    }

    const claimed = {};
    for (i = 0; i < bikes.length; i++) {
      b = bikes[i];
      if (!b.alive) continue;
      n = nexts[i];
      if (!n) {
        crashBike(st, b, 'wall', events);
        continue;
      }
      if (st.grid[gi(n.c, n.r)] !== 0) {
        crashBike(st, b, 'trail', events);
        continue;
      }
      k = n.c + ',' + n.r;
      if (!claimed[k]) claimed[k] = [];
      claimed[k].push(i);
    }

    for (k in claimed) {
      if (!Object.prototype.hasOwnProperty.call(claimed, k)) continue;
      list = claimed[k];
      if (list.length < 2) continue;
      for (i = 0; i < list.length; i++) {
        crashBike(st, bikes[list[i]], 'head', events);
      }
    }

    for (i = 0; i < bikes.length; i++) {
      b = bikes[i];
      if (!b.alive) continue;
      n = nexts[i];
      b.pc = b.c;
      b.pr = b.r;
      b.c = n.c;
      b.r = n.r;
      b.jump = n.wrap;
      if (n.wrap) events.wraps.push(b.id);
    }

    st.tick += 1;
    return events;
  }

  function selfCheck() {
    let st, b, i, a, y, seen, k, d0;

    st = freshState('arena');
    if (st.grid.length !== COLS * ROWS) throw new Error('grid size');
    if (st.bikes.length !== 4) throw new Error('4 bikes');
    if (st.wrap) throw new Error('arena no wrap');
    if (COLS !== 40 || ROWS !== 28) throw new Error('40×28 arena');

    st = freshState('wrap');
    if (!st.wrap) throw new Error('wrap flag');

    b = st.bikes[0];
    b.dir = EAST;
    if (queueTurn(b, WEST)) throw new Error('ignore 180');
    if (b.pending !== -1) throw new Error('180 no pending');
    if (!queueTurn(b, NORTH)) throw new Error('queue north');
    if (b.pending !== NORTH) throw new Error('pending north');
    queueTurn(b, SOUTH);
    if (b.pending !== SOUTH) throw new Error('replace pending');
    queueTurn(b, EAST);
    if (b.pending !== -1) throw new Error('same-as-current cancels');

    st = freshState('arena');
    b = st.bikes[0];
    b.c = 0;
    b.r = 10;
    b.dir = WEST;
    b.pending = -1;
    for (i = 1; i < 4; i++) st.bikes[i].alive = false;
    stepWorld(st, false);
    if (b.alive) throw new Error('walled west must die');

    st = freshState('wrap');
    b = st.bikes[0];
    b.c = 0;
    b.r = 10;
    b.dir = WEST;
    b.pending = -1;
    for (i = 1; i < 4; i++) st.bikes[i].alive = false;
    stepWorld(st, false);
    if (!b.alive) throw new Error('wrap west must live');
    if (b.c !== COLS - 1 || b.r !== 10) throw new Error('wrap to right edge');

    st = freshState('arena');
    for (i = 1; i < 4; i++) st.bikes[i].alive = false;
    b = st.bikes[0];
    b.c = 5;
    b.r = 5;
    b.dir = EAST;
    b.pending = -1;
    stepWorld(st, false);
    if (st.grid[gi(5, 5)] !== 1) throw new Error('leave trail');
    if (!b.alive || b.c !== 6 || b.r !== 5) throw new Error('step east');
    b.dir = WEST;
    stepWorld(st, false);
    if (b.alive) throw new Error('own trail kills');

    st = freshState('arena');
    st.bikes[2].alive = false;
    st.bikes[3].alive = false;
    a = st.bikes[0];
    y = st.bikes[1];
    a.c = 5;
    a.r = 8;
    a.dir = EAST;
    a.pending = -1;
    y.c = 6;
    y.r = 8;
    y.dir = WEST;
    y.pending = -1;
    stepWorld(st, false);
    if (a.alive || y.alive) throw new Error('head-on both die');

    st = freshState('arena');
    st.bikes[2].alive = false;
    st.bikes[3].alive = false;
    a = st.bikes[0];
    y = st.bikes[1];
    a.c = 5;
    a.r = 8;
    a.dir = EAST;
    a.pending = -1;
    y.c = 7;
    y.r = 8;
    y.dir = WEST;
    y.pending = -1;
    stepWorld(st, false);
    if (a.alive || y.alive) throw new Error('same cell both die');

    st = freshState('arena');
    st.bikes[1].alive = false;
    st.bikes[2].alive = false;
    st.bikes[3].alive = false;
    if (aliveCount(st) !== 1) throw new Error('last one');
    if (!st.bikes[0].alive) throw new Error('player last');

    st = freshState('arena');
    for (i = 1; i < 4; i++) st.bikes[i].alive = false;
    b = st.bikes[0];
    b.c = 8;
    b.r = 8;
    b.dir = EAST;
    queueTurn(b, NORTH);
    stepWorld(st, false);
    if (b.dir !== NORTH) throw new Error('turn applied');
    if (b.c !== 8 || b.r !== 7) throw new Error('moved north');

    st = freshState('arena');
    seen = {};
    for (i = 0; i < 4; i++) {
      k = st.bikes[i].c + ',' + st.bikes[i].r;
      if (seen[k]) throw new Error('start overlap');
      seen[k] = 1;
      if (st.bikes[i].c < 0 || st.bikes[i].r < 0 || st.bikes[i].c >= COLS || st.bikes[i].r >= ROWS) {
        throw new Error('start oob');
      }
    }

    st = freshState('arena');
    d0 = st.bikes[1].dir;
    thinkBike(st, st.bikes[1]);
    if (st.bikes[1].pending === OPP[d0]) throw new Error('AI 180');

    st = freshState('arena');
    for (i = 0; i < 4; i++) if (i !== 1) st.bikes[i].alive = false;
    b = st.bikes[1];
    b.c = 0;
    b.r = 8;
    b.dir = WEST;
    b.pending = -1;
    thinkBike(st, b);
    stepWorld(st, false);
    if (!b.alive) throw new Error('AI should turn off wall');

    st = freshState('arena');
    for (i = 1; i < 4; i++) st.bikes[i].alive = false;
    b = st.bikes[0];
    b.c = COLS - 1;
    b.r = 8;
    b.dir = EAST;
    b.pending = -1;
    stepWorld(st, false);
    if (b.alive) throw new Error('arena east wall');
    if (b.c === 0) throw new Error('must not wrap in arena');

    st = freshState('wrap');
    for (i = 1; i < 4; i++) st.bikes[i].alive = false;
    b = st.bikes[0];
    b.c = COLS - 1;
    b.r = 8;
    b.dir = EAST;
    b.pending = -1;
    stepWorld(st, false);
    if (!b.alive) throw new Error('wrap east lives');
    if (b.c !== 0 || b.r !== 8) throw new Error('wrap to left edge');

    st = freshState('arena');
    for (i = 0; i < 4; i++) st.bikes[i].ai = true;
    for (i = 0; i < 24; i++) stepWorld(st, true);
    if (aliveCount(st) < 2) throw new Error('opening should keep several bikes alive');

    st = freshState('wrap');
    for (i = 0; i < 4; i++) st.bikes[i].ai = true;
    for (i = 0; i < 20; i++) stepWorld(st, true);
    if (aliveCount(st) < 2) throw new Error('wrap opening should keep several bikes alive');

    let survived = 0;
    let g;
    for (g = 0; g < 6; g++) {
      st = freshState(g % 2 ? 'wrap' : 'arena');
      for (i = 0; i < 4; i++) st.bikes[i].ai = true;
      i = 0;
      while (st.bikes[0].alive && i < 90) {
        stepWorld(st, true);
        i += 1;
      }
      if (i >= 35) survived += 1;
    }
    if (survived < 3) throw new Error('AI too fragile in opening');
  }

  selfCheck();

  if (!hasDom) return;

  function el(id) {
    return document.getElementById(id);
  }

  const canvas = el('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = el('overlay');
  const panel = el('panel');
  const ovKicker = el('ov-kicker');
  const ovTitle = el('ov-title');
  const ovLead = el('ov-lead');
  const ovOps = el('ov-ops');
  const ovStart = el('ov-start');
  const ovEnd = el('ov-end');
  const btnArena = el('btn-arena');
  const btnWrap = el('btn-wrap');
  const btnAgain = el('btn-again');
  const btnMenu = el('btn-menu');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
  const btnMode = el('btn-mode');
  const scoreEl = el('score');
  const bestEl = el('best');
  const scoreBox = el('score-box');
  const scoreAdd = el('score-add');
  const roundEl = el('round');
  const stageLabel = el('stage-label');
  const tagLabel = el('tag-label');
  const comboLabel = el('combo-label');
  const pipsEl = el('pips');
  const toastEl = el('toast');
  const hintEl = el('hint');
  const stageEl = el('stage');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let cell = 16;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let kickTok = 0;

  const pips = [];
  const particles = [];
  const floaters = [];
  const snaps = [];

  const pointer = { down: false, x: 0, y: 0, id: null };

  const G = {
    mode: 'title',
    kind: 'arena',
    round: 1,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 1,
    freeze: 0,
    shake: 0,
    flash: 0,
    flashRgb: PAL[0].rgb,
    acc: 0,
    goT: 0,
    toastT: 0,
    endT: 0,
    result: '',
    world: null,
    demo: null,
    demoAcc: 0
  };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }

  function kindName(kind) {
    return kind === 'wrap' ? '无界' : '竞技场';
  }

  function comboName(n) {
    if (n <= 1) return '×1';
    if (n === 2) return '×2 连斩';
    if (n === 3) return '×3 三连';
    if (n === 4) return '×4 光斩';
    return '×' + n + ' 环神';
  }

  function loadBest() {
    try {
      const n = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
      return isFinite(n) && n > 0 ? n : 0;
    } catch (err) {
      return 0;
    }
  }

  function saveBest() {
    if (G.score > G.best) {
      G.best = G.score;
      try { localStorage.setItem(BEST_KEY, String(G.best)); } catch (err) { /* ignore */ }
      if (bestEl) bestEl.textContent = String(G.best);
    }
  }

  function loadKind() {
    try {
      const k = localStorage.getItem(KIND_KEY);
      return k === 'wrap' ? 'wrap' : 'arena';
    } catch (err) {
      return 'arena';
    }
  }

  function saveKind(kind) {
    try { localStorage.setItem(KIND_KEY, kind); } catch (err) { /* ignore */ }
  }

  function loadMute() {
    try {
      return localStorage.getItem(MUTE_KEY) === '1';
    } catch (err) {
      return false;
    }
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
      o.frequency.setValueAtTime(freq, t);
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
      const n = 0.1;
      const sr = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, Math.max(1, (sr * n) | 0), sr);
      const data = buf.getChannelData(0);
      let i;
      for (i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = hp || 600;
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
    tick() { this.beep(1180, 0.032, 'square', 0.045, 1540); },
    turn() { this.beep(1480, 0.05, 'square', 0.06, 2100); },
    wrap() { this.beep(240, 0.07, 'sine', 0.04, 520); },
    kill() {
      this.beep(320, 0.12, 'sawtooth', 0.05, 90);
      this.noise(0.1, 0.08, 900);
    },
    die() {
      this.beep(180, 0.34, 'sawtooth', 0.07, 48);
      this.noise(0.22, 0.12, 400);
    },
    go() {
      this.beep(392, 0.08, 'square', 0.05, 523);
      this.beep(659, 0.14, 'square', 0.05);
    },
    win() {
      this.beep(392, 0.1, 'square', 0.055, 523);
      const self = this;
      setTimeout(function () { self.beep(523, 0.1, 'square', 0.055, 659); }, 80);
      setTimeout(function () { self.beep(784, 0.18, 'square', 0.06); }, 160);
    }
  };

  function hitStop(sec) {
    if (REDUCE) return;
    G.freeze = Math.max(G.freeze, sec);
  }

  function kick(kind) {
    if (!stageEl || REDUCE) return;
    stageEl.classList.remove('die', 'cut');
    void stageEl.offsetWidth;
    stageEl.classList.add(kind);
    kickTok += 1;
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) stageEl.classList.remove('die', 'cut');
    }, 340);
  }

  function toast(msg, warn, gold) {
    G.toastT = 1.35;
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
  }

  function setHint(text, kind) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function burst(x, y, rgb, n, speed) {
    const cap = REDUCE ? 10 : n;
    let i;
    for (i = 0; i < cap; i++) {
      if (particles.length > 240) particles.shift();
      const ang = Math.random() * TAU;
      const sp = rand(speed * 0.25, speed);
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: 1,
        decay: rand(1.6, 3.2),
        rgb: rgb,
        size: rand(1.2, 3.4)
      });
    }
  }

  function trailSpark(x, y, rgb, dir) {
    if (REDUCE) return;
    if (particles.length > 240) particles.shift();
    const bx = -DX[dir];
    const by = -DY[dir];
    particles.push({
      x: x + rand(-cell * 0.15, cell * 0.15),
      y: y + rand(-cell * 0.15, cell * 0.15),
      vx: bx * rand(18, 46) + rand(-12, 12),
      vy: by * rand(18, 46) + rand(-12, 12),
      life: 1,
      decay: rand(2.4, 4.2),
      rgb: rgb,
      size: rand(0.9, 2.1)
    });
  }

  function addFloater(c, r, text, rgb) {
    floaters.push({
      x: ox + (c + 0.5) * cell,
      y: oy + (r + 0.5) * cell,
      text: text,
      rgb: rgb,
      life: 1
    });
  }

  function addScore(n) {
    if (n <= 0) return;
    if (G.mode === 'title') return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
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

  function bumpCombo() {
    G.combo += 1;
    syncCombo();
  }

  function resetCombo() {
    G.combo = 1;
    syncCombo();
  }

  function syncCombo() {
    if (!comboLabel) return;
    comboLabel.textContent = comboName(G.combo);
    comboLabel.classList.toggle('on', G.combo >= 2);
    if (G.combo >= 2) {
      comboLabel.classList.remove('on');
      void comboLabel.offsetWidth;
      comboLabel.classList.add('on');
    }
  }

  function syncPips() {
    if (!pipsEl) return;
    while (pips.length < LIVES) {
      const node = document.createElement('i');
      node.className = 'pip on';
      pipsEl.appendChild(node);
      pips.push(node);
    }
    let i;
    for (i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (roundEl) roundEl.textContent = String(G.round);
    if (stageLabel) {
      stageLabel.textContent = kindName(G.kind);
      stageLabel.classList.toggle('hot', G.kind === 'wrap');
    }
    if (btnMode) {
      btnMode.textContent = kindName(G.kind);
      btnMode.setAttribute('aria-label', '模式 ' + kindName(G.kind));
    }
    if (tagLabel) tagLabel.textContent = G.mode === 'over' ? 'OVER' : 'TRON';
    syncCombo();
    syncPips();
  }

  function stepMsFor(round, tick) {
    const base = Math.max(FLOOR_MS, BASE_MS - (round - 1) * MS_PER_ROUND);
    const late = Math.max(0, tick - 200);
    return Math.max(FLOOR_MS, base - late * 0.12);
  }

  function showOverlay(kind) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    if (panel) {
      panel.classList.remove('win', 'lose', 'title');
      if (kind) panel.classList.add(kind);
    }
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function titleScreen() {
    G.mode = 'title';
    G.world = null;
    G.demo = freshState(G.kind);
    let i;
    for (i = 0; i < G.demo.bikes.length; i++) G.demo.bikes[i].ai = true;
    G.demoAcc = 0;
    G.result = '';
    if (ovKicker) ovKicker.textContent = 'TRON';
    if (ovTitle) ovTitle.textContent = '光环';
    if (ovLead) {
      ovLead.innerHTML = '霓虹光车永远在跑。九十度急转，身后留下实心墙迹。<br>撞墙、撞迹、撞车即死。最后一辆活着的车赢下这一局。';
    }
    if (ovOps) ovOps.textContent = OPS;
    showOverlay('title');
    setHint('永远前进 · 90° 急转 · 墙迹即死 · 最后一台赢');
    syncHud();
  }

  function startGame(kind) {
    audio.ensure();
    G.kind = kind === 'wrap' ? 'wrap' : 'arena';
    saveKind(G.kind);
    G.score = 0;
    G.combo = 1;
    G.round = 1;
    G.lives = LIVES;
    G.best = G.best || 0;
    particles.length = 0;
    floaters.length = 0;
    snaps.length = 0;
    hideOverlay();
    startRound(true);
    syncHud();
  }

  function startRound(fromStart) {
    G.world = freshState(G.kind);
    G.world.bikes[0].ai = false;
    G.mode = 'go';
    G.goT = 0.55;
    G.acc = 0;
    G.freeze = 0;
    G.shake = 0;
    G.flash = 0;
    G.result = '';
    G.endT = 0;
    G.demo = null;
    hideOverlay();
    audio.go();
    toast('走！', false, true);
    setHint(G.kind === 'wrap' ? '无界：对侧穿出 · 墙迹仍是实心的' : '竞技场：四边实墙 · 急转甩开光车');
    if (fromStart) {
      if (scoreEl) scoreEl.textContent = '0';
    }
    syncHud();
    if (canvas && typeof canvas.focus === 'function') canvas.focus();
  }

  function retry() {
    audio.ensure();
    startGame(G.kind);
  }

  function toggleMute() {
    audio.ensure();
    audio.setMuted(!audio.muted);
  }

  function toggleKind() {
    const next = G.kind === 'wrap' ? 'arena' : 'wrap';
    if (G.mode === 'title') {
      G.kind = next;
      saveKind(G.kind);
      G.demo = freshState(G.kind);
      let i;
      for (i = 0; i < G.demo.bikes.length; i++) G.demo.bikes[i].ai = true;
      syncHud();
      return;
    }
    startGame(next);
  }

  function cellPx(c, r) {
    return {
      x: ox + (c + 0.5) * cell,
      y: oy + (r + 0.5) * cell
    };
  }

  function bikeDrawPos(b, frac) {
    if (!b.alive || b.jump || (G.mode !== 'play' && G.mode !== 'title')) {
      return cellPx(b.c, b.r);
    }
    const t = clamp(frac, 0, 1);
    return {
      x: ox + (b.pc + (b.c - b.pc) * t + 0.5) * cell,
      y: oy + (b.pr + (b.r - b.pr) * t + 0.5) * cell
    };
  }

  function handleEvents(st, events, scoring) {
    let i, ev, b, p, rgb;
    for (i = 0; i < events.turns.length; i++) {
      b = st.bikes[events.turns[i] - 1];
      if (!b) continue;
      p = cellPx(b.c, b.r);
      rgb = PAL[b.id - 1].rgb;
      snaps.push({ x: p.x, y: p.y, rgb: rgb, t: 1 });
      burst(p.x, p.y, rgb, 8, 70);
      if (scoring && b.id === 1) {
        audio.turn();
        kick('cut');
      }
    }
    for (i = 0; i < events.wraps.length; i++) {
      if (scoring && events.wraps[i] === 1) audio.wrap();
    }
    for (i = 0; i < events.crashes.length; i++) {
      ev = events.crashes[i];
      rgb = PAL[ev.id - 1].rgb;
      p = cellPx(ev.c, ev.r);
      burst(p.x, p.y, rgb, ev.id === 1 ? 36 : 22, ev.id === 1 ? 160 : 120);
      if (scoring) {
        G.flash = ev.id === 1 ? 0.55 : 0.28;
        G.flashRgb = rgb;
      }
      if (!scoring) continue;
      if (ev.id === 1) {
        audio.die();
        hitStop(0.07);
        G.shake = 0.34;
        kick('die');
      } else {
        audio.kill();
        hitStop(0.038);
        G.shake = Math.max(G.shake, 0.16);
        bumpCombo();
        const pts = KILL_SCORE * G.combo;
        addScore(pts);
        addFloater(ev.c, ev.r, '+' + pts, rgb);
        toast('击坠 ' + PAL[ev.id - 1].name, false, true);
      }
    }

    if (!scoring) return;

    const player = st.bikes[0];
    if (!player.alive) {
      onPlayerCrash();
      return;
    }
    if (aliveCount(st) === 1) {
      onRoundWin();
    }
  }

  function onPlayerCrash() {
    G.lives -= 1;
    resetCombo();
    syncPips();
    G.mode = 'settle';
    G.result = 'dead';
    G.endT = 0.72;
    if (G.lives <= 0) {
      toast('命尽', true, false);
      setHint('撞毁了 · R 重开', 'warn');
    } else {
      toast('撞毁 −1 命', true, false);
      setHint('还剩 ' + G.lives + ' 命 · 马上再开', 'warn');
    }
  }

  function onRoundWin() {
    bumpCombo();
    const pts = WIN_SCORE * Math.min(G.combo, 9) + G.round * WIN_ROUND;
    addScore(pts);
    const p = G.world.bikes[0];
    addFloater(p.c, p.r, '+' + pts, PAL[0].rgb);
    audio.win();
    hitStop(0.052);
    G.shake = 0.18;
    kick('cut');
    G.round += 1;
    G.mode = 'settle';
    G.result = 'win';
    G.endT = 0.82;
    toast('清场 第' + (G.round - 1) + '环', false, true);
    setHint('更快一环 · 连斩 ' + comboName(G.combo), 'hot');
    syncHud();
  }

  function gameOver() {
    G.mode = 'over';
    saveBest();
    if (ovKicker) ovKicker.textContent = 'TRON';
    if (ovTitle) ovTitle.textContent = '命尽';
    if (ovLead) {
      ovLead.textContent = '分数 ' + G.score + ' · 最高 ' + G.best + ' · 停在第 ' + G.round + ' 环';
    }
    if (ovOps) ovOps.textContent = 'R 重开 · 1 竞技场 · 2 无界';
    showOverlay('lose');
    setHint('命尽 · R 重开', 'warn');
    if (tagLabel) {
      tagLabel.textContent = 'OVER';
      tagLabel.classList.add('warn');
    }
  }

  function settleDone() {
    if (G.result === 'win') {
      startRound(false);
      return;
    }
    if (G.lives <= 0) {
      gameOver();
      return;
    }
    startRound(false);
  }

  function emitStepSparks(st) {
    let i, b, p;
    for (i = 0; i < st.bikes.length; i++) {
      b = st.bikes[i];
      if (!b.alive) continue;
      p = cellPx(b.pc, b.pr);
      trailSpark(p.x, p.y, PAL[b.id - 1].rgb, b.dir);
      if (!REDUCE) trailSpark(p.x, p.y, PAL[b.id - 1].rgb, b.dir);
    }
  }

  function playStep() {
    const st = G.world;
    if (!st) return;
    const events = stepWorld(st, true);
    emitStepSparks(st);
    if (st.bikes[0].alive) addScore(1);
    handleEvents(st, events, true);
  }

  function demoStep() {
    const st = G.demo;
    if (!st) return;
    const events = stepWorld(st, true);
    handleEvents(st, events, false);
    if (aliveCount(st) <= 1) {
      G.demo = freshState(G.kind);
      let i;
      for (i = 0; i < G.demo.bikes.length; i++) G.demo.bikes[i].ai = true;
    }
  }

  function applyDir(dir) {
    if (G.mode !== 'play' && G.mode !== 'go') return;
    const b = G.world && G.world.bikes[0];
    if (!b || !b.alive) return;
    if (queueTurn(b, dir)) audio.tick();
  }

  function pointerDir(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? EAST : WEST;
    return dy > 0 ? SOUTH : NORTH;
  }

  function canvasPos(ev) {
    const rect = canvas.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  }

  function layout() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pad = 18;
    cell = Math.min((W - pad * 2) / COLS, (H - pad * 2) / ROWS);
    if (cell < 4) cell = 4;
    ox = (W - COLS * cell) / 2;
    oy = (H - ROWS * cell) / 2;
  }

  function neighborSame(st, c, r, dc, dr, id) {
    let nc = c + dc;
    let nr = r + dr;
    if (st.wrap) {
      if (nc < 0) nc += COLS;
      else if (nc >= COLS) nc -= COLS;
      if (nr < 0) nr += ROWS;
      else if (nr >= ROWS) nr -= ROWS;
    } else if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) {
      return false;
    }
    return st.grid[gi(nc, nr)] === id;
  }

  function drawTrails(st) {
    const grid = st.grid;
    const m = cell * 0.2;
    let r, c, i, id, rgb, x, y, x0, y0, x1, y1, core;
    for (r = 0; r < ROWS; r++) {
      for (c = 0; c < COLS; c++) {
        i = gi(c, r);
        id = grid[i];
        if (!id) continue;
        rgb = PAL[id - 1].rgb;
        x = c * cell;
        y = r * cell;
        x0 = x + m;
        y0 = y + m;
        x1 = x + cell - m;
        y1 = y + cell - m;
        if (neighborSame(st, c, r, -1, 0, id)) x0 = x;
        if (neighborSame(st, c, r, 1, 0, id)) x1 = x + cell;
        if (neighborSame(st, c, r, 0, -1, id)) y0 = y;
        if (neighborSame(st, c, r, 0, 1, id)) y1 = y + cell;
        ctx.fillStyle = rgba(rgb, 0.22);
        ctx.fillRect(x0 - 1.2, y0 - 1.2, x1 - x0 + 2.4, y1 - y0 + 2.4);
        core = cell * 0.22;
        ctx.fillStyle = rgba(rgb, 0.92);
        ctx.fillRect(x0 + core * 0.15, y0 + core * 0.15, (x1 - x0) - core * 0.3, (y1 - y0) - core * 0.3);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillRect(
          (x0 + x1) / 2 - cell * 0.07,
          (y0 + y1) / 2 - cell * 0.07,
          cell * 0.14,
          cell * 0.14
        );
      }
    }
  }

  function drawBike(b, frac) {
    const p = bikeDrawPos(b, frac);
    const rgb = PAL[b.id - 1].rgb;
    const punch = b.punch;
    const s = cell * (0.9 + punch * 0.32);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(b.dir * Math.PI / 2);
    ctx.fillStyle = rgba(rgb, 0.28 + punch * 0.2);
    ctx.beginPath();
    ctx.ellipse(0, s * 0.08, s * 0.62, s * 0.92, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.74);
    ctx.lineTo(s * 0.4, s * 0.52);
    ctx.lineTo(0, s * 0.16);
    ctx.lineTo(-s * 0.4, s * 0.52);
    ctx.closePath();
    ctx.fillStyle = rgba(rgb, 1);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = Math.max(1, cell * 0.06);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.62);
    ctx.lineTo(s * 0.15, -s * 0.08);
    ctx.lineTo(-s * 0.15, -s * 0.08);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -s * 0.7, Math.max(1.15, cell * 0.11), 0, TAU);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
  }

  function drawCrash(b) {
    if (b.crashT <= 0) return;
    const p = cellPx(b.c, b.r);
    const rgb = PAL[b.id - 1].rgb;
    const t = 1 - b.crashT;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.strokeStyle = rgba(rgb, b.crashT);
    ctx.lineWidth = Math.max(1.5, cell * 0.12);
    ctx.beginPath();
    ctx.arc(0, 0, cell * (0.4 + t * 1.6), 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawGrid(st) {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.fillStyle = '#041018';
    ctx.fillRect(-2, -2, COLS * cell + 4, ROWS * cell + 4);

    let c, r, x, y;
    ctx.strokeStyle = 'rgba(0, 232, 255, 0.055)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (c = 0; c <= COLS; c++) {
      x = c * cell;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ROWS * cell);
    }
    for (r = 0; r <= ROWS; r++) {
      y = r * cell;
      ctx.moveTo(0, y);
      ctx.lineTo(COLS * cell, y);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 232, 255, 0.16)';
    ctx.beginPath();
    for (c = 0; c <= COLS; c += 4) {
      x = c * cell;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ROWS * cell);
    }
    for (r = 0; r <= ROWS; r += 4) {
      y = r * cell;
      ctx.moveTo(0, y);
      ctx.lineTo(COLS * cell, y);
    }
    ctx.stroke();

    if (!st.wrap) {
      ctx.strokeStyle = 'rgba(0, 232, 255, 0.72)';
      ctx.shadowColor = 'rgba(0, 232, 255, 0.55)';
      ctx.shadowBlur = REDUCE ? 0 : 12;
      ctx.lineWidth = Math.max(2, cell * 0.18);
      ctx.strokeRect(0.5, 0.5, COLS * cell - 1, ROWS * cell - 1);
      ctx.shadowBlur = 0;
    } else {
      ctx.strokeStyle = 'rgba(255, 227, 107, 0.28)';
      ctx.setLineDash([cell * 0.45, cell * 0.35]);
      ctx.lineWidth = Math.max(1.2, cell * 0.08);
      ctx.strokeRect(0.5, 0.5, COLS * cell - 1, ROWS * cell - 1);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawWorld(st, frac) {
    drawGrid(st);
    ctx.save();
    ctx.translate(ox, oy);
    drawTrails(st);
    ctx.restore();

    let i, b;
    for (i = 0; i < st.bikes.length; i++) {
      b = st.bikes[i];
      if (b.alive) drawBike(b, frac);
      else drawCrash(b);
    }
  }

  function tickFx(dt) {
    let i, p, s;
    for (i = particles.length - 1; i >= 0; i--) {
      p = particles[i];
      p.life -= dt * p.decay;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (i = snaps.length - 1; i >= 0; i--) {
      s = snaps[i];
      s.t -= dt * 3.6;
      if (s.t <= 0) snaps.splice(i, 1);
    }
    for (i = floaters.length - 1; i >= 0; i--) {
      p = floaters[i];
      p.life -= dt * 1.15;
      p.y -= 28 * dt;
      if (p.life <= 0) floaters.splice(i, 1);
    }
  }

  function drawFx() {
    let i, p, s;
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      ctx.fillStyle = rgba(p.rgb, Math.max(0, p.life) * 0.9);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.4 + p.life), 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < snaps.length; i++) {
      s = snaps[i];
      ctx.strokeStyle = rgba(s.rgb, s.t);
      ctx.lineWidth = Math.max(1.2, cell * 0.1);
      ctx.strokeRect(s.x - cell * (0.4 + (1 - s.t) * 0.8), s.y - cell * (0.4 + (1 - s.t) * 0.8),
        cell * (0.8 + (1 - s.t) * 1.6), cell * (0.8 + (1 - s.t) * 1.6));
    }
    ctx.font = '700 ' + Math.max(12, cell * 0.72) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (i = 0; i < floaters.length; i++) {
      p = floaters[i];
      ctx.fillStyle = rgba(p.rgb, Math.max(0, p.life));
      ctx.fillText(p.text, p.x, p.y);
    }
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.18);
      ctx.fillRect(0, 0, W, H);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#02050a';
    ctx.fillRect(0, 0, W, H);

    const st = G.world || G.demo;
    const ms = st ? stepMsFor(G.mode === 'title' ? 1 : G.round, st.tick) : BASE_MS;
    let frac = 0;
    if (st && G.mode === 'play') frac = clamp(G.acc / ms, 0, 1);
    else if (st && G.mode === 'title') frac = clamp(G.demoAcc / 72, 0, 1);

    ctx.save();
    if (G.shake > 0 && !REDUCE) {
      const mag = G.shake * 8;
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }
    if (st) drawWorld(st, frac);
    drawFx();
    ctx.restore();
  }

  function tickBikes(st, dt) {
    let i, b;
    for (i = 0; i < st.bikes.length; i++) {
      b = st.bikes[i];
      if (b.punch > 0) b.punch = Math.max(0, b.punch - dt * 6.5);
      if (b.crashT > 0) b.crashT = Math.max(0, b.crashT - dt * 1.8);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (!frame.last) frame.last = now;
    let dt = (now - frame.last) / 1000;
    frame.last = now;
    if (dt > 0.05) dt = 0.05;
    if (hidden) {
      draw();
      return;
    }

    tickFx(dt);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 2.8);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 3.2);

    if (G.freeze > 0) {
      G.freeze -= dt;
      if (G.world) tickBikes(G.world, dt);
      draw();
      return;
    }

    if (G.mode === 'title' && G.demo) {
      tickBikes(G.demo, dt);
      G.demoAcc += dt * 1000;
      const ms = 72;
      while (G.demoAcc >= ms) {
        G.demoAcc -= ms;
        demoStep();
      }
    } else if (G.mode === 'go') {
      G.goT -= dt;
      if (G.world) tickBikes(G.world, dt);
      if (G.goT <= 0) {
        G.mode = 'play';
        G.acc = 0;
      }
    } else if (G.mode === 'play' && G.world) {
      tickBikes(G.world, dt);
      G.acc += dt * 1000;
      const ms = stepMsFor(G.round, G.world.tick);
      while (G.acc >= ms && G.mode === 'play') {
        G.acc -= ms;
        playStep();
      }
    } else if (G.mode === 'settle') {
      if (G.world) tickBikes(G.world, dt);
      G.endT -= dt;
      if (G.endT <= 0) settleDone();
    } else if (G.mode === 'over' && G.world) {
      tickBikes(G.world, dt);
    }

    draw();
  }

  function onKey(e) {
    if (e.repeat && (e.code === 'KeyR' || e.code === 'KeyM')) return;
    audio.ensure();
    if (e.code === 'KeyR') {
      e.preventDefault();
      retry();
      return;
    }
    if (e.code === 'KeyM') {
      e.preventDefault();
      toggleMute();
      return;
    }
    if (e.code === 'Digit1' || e.code === 'Numpad1') {
      if (G.mode === 'title' || G.mode === 'over') {
        e.preventDefault();
        startGame('arena');
      }
      return;
    }
    if (e.code === 'Digit2' || e.code === 'Numpad2') {
      if (G.mode === 'title' || G.mode === 'over') {
        e.preventDefault();
        startGame('wrap');
      }
      return;
    }
    if (e.code === 'Enter' || e.code === 'Space') {
      if (G.mode === 'title') {
        e.preventDefault();
        startGame(G.kind);
      } else if (G.mode === 'over') {
        e.preventDefault();
        retry();
      }
      return;
    }
    const dir = KEY_DIR[e.code];
    if (dir == null) return;
    e.preventDefault();
    applyDir(dir);
  }

  function onPointerDown(e) {
    audio.ensure();
    if (G.mode === 'title' || G.mode === 'over') return;
    pointer.down = true;
    pointer.id = e.pointerId;
    const p = canvasPos(e);
    pointer.x = p.x;
    pointer.y = p.y;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  }

  function onPointerUp(e) {
    if (!pointer.down) return;
    if (pointer.id != null && e.pointerId !== pointer.id) return;
    pointer.down = false;
    const p = canvasPos(e);
    const dx = p.x - pointer.x;
    const dy = p.y - pointer.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist >= SWIPE_MIN) {
      applyDir(pointerDir(dx, dy));
      return;
    }
    if (G.mode !== 'play' && G.mode !== 'go') return;
    const b = G.world && G.world.bikes[0];
    if (!b || !b.alive) return;
    const pos = bikeDrawPos(b, 0.5);
    applyDir(pointerDir(p.x - pos.x, p.y - pos.y));
  }

  function onPointerCancel() {
    pointer.down = false;
    pointer.id = null;
  }

  G.best = loadBest();
  G.kind = loadKind();
  audio.setMuted(loadMute());
  syncHud();
  titleScreen();
  layout();

  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', layout);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerCancel);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  if (btnArena) btnArena.addEventListener('click', function () { startGame('arena'); });
  if (btnWrap) btnWrap.addEventListener('click', function () { startGame('wrap'); });
  if (btnAgain) btnAgain.addEventListener('click', function () { retry(); });
  if (btnMenu) btnMenu.addEventListener('click', function () { audio.ensure(); titleScreen(); });
  if (btnMute) btnMute.addEventListener('click', toggleMute);
  if (btnRetry) btnRetry.addEventListener('click', retry);
  if (btnMode) btnMode.addEventListener('click', function () { audio.ensure(); toggleKind(); });

  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden) frame.last = 0;
  });

  requestAnimationFrame(frame);
})();
