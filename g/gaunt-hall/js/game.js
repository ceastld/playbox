'use strict';

(function () {
  const COLS = 21;
  const ROWS = 13;
  const EMPTY = 0;
  const WALL = 1;
  const EXIT = 2;
  const FOOD = 3;
  const LOOT = 4;
  const POTION = 5;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const P_SPD = 4.72;
  const P_R = 0.28;
  const M_R = 0.3;
  const G_R = 0.38;
  const S_R = 0.14;
  const P_SHOT = 15.4;
  const D_SHOT = 6.8;
  const FIRE_CD = 0.118;
  const FIRE_POW = 0.066;
  const MAX_SHOTS = 6;
  const MAX_SHOTS_POW = 9;
  const MAX_MON = 18;
  const MAX_MON_END = 22;
  const HP_START = 100;
  const HP_MAX = 130;
  const HP_FOOD = 30;
  const HP_LOW = 24;
  const POW_TIME = 5.2;
  const COMBO_WIN = 1.48;
  const CONTACT_CD = 0.34;
  const BEST_KEY = 'playbox-gaunt-hall-best';
  const MUTE_KEY = 'playbox-gaunt-hall-mute';
  const DX = [0, 1, 0, -1];
  const DY = [-1, 0, 1, 0];
  const OCT = [
    [1, 0], [1, 1], [0, 1], [-1, 1],
    [-1, 0], [-1, -1], [0, -1], [1, -1]
  ];
  const OPS = 'WASD / 方向键八向走 · 按住空格开火 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 90, 31];
  const HOT2 = [255, 140, 74];
  const WHT = [246, 243, 255];
  const GRN = [109, 255, 154];
  const PUR = [186, 92, 255];

  const TYPE = {
    grunt: { rgb: HOT2, spd: 1.92, hp: 1, score: 40, dmg: 14, r: 0.3 },
    ghost: { rgb: MAG, spd: 1.42, hp: 1, score: 70, dmg: 10, r: 0.3 },
    demon: { rgb: [255, 72, 64], spd: 1.38, hp: 1, score: 90, dmg: 15, r: 0.32 }
  };

  const FLOORS = [
    { name: '入口', gens: 2, grunt: 2, ghost: 0, demon: 0, spawn: 2.55, drain: 4.2, food: 4, loot: 3, pot: 1, hp: 4, rooms: 4 },
    { name: '回廊', gens: 3, grunt: 2, ghost: 1, demon: 0, spawn: 2.28, drain: 4.35, food: 4, loot: 3, pot: 1, hp: 4, rooms: 5 },
    { name: '祭坛', gens: 3, grunt: 1, ghost: 1, demon: 1, spawn: 2.08, drain: 4.5, food: 4, loot: 4, pot: 1, hp: 5, rooms: 5 },
    { name: '魔窖', gens: 4, grunt: 2, ghost: 1, demon: 1, spawn: 1.9, drain: 4.65, food: 5, loot: 4, pot: 1, hp: 5, rooms: 5 },
    { name: '骸厅', gens: 4, grunt: 1, ghost: 2, demon: 1, spawn: 1.72, drain: 4.8, food: 5, loot: 4, pot: 1, hp: 5, rooms: 6 },
    { name: '火井', gens: 5, grunt: 1, ghost: 2, demon: 2, spawn: 1.55, drain: 5.0, food: 5, loot: 5, pot: 1, hp: 6, rooms: 6 },
    { name: '深渊', gens: 5, grunt: 1, ghost: 2, demon: 2, spawn: 1.4, drain: 5.15, food: 5, loot: 5, pot: 2, hp: 6, rooms: 6 },
    { name: '王座', gens: 6, grunt: 2, ghost: 2, demon: 2, spawn: 1.22, drain: 5.3, food: 6, loot: 5, pot: 2, hp: 7, rooms: 6 }
  ];

  const hasDom = typeof document !== 'undefined';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  function el(id) {
    return hasDom ? document.getElementById(id) : null;
  }
  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function idx(c, r) {
    return r * COLS + c;
  }
  function inb(c, r) {
    return c >= 0 && r >= 0 && c < COLS && r < ROWS;
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function snap8(dx, dy) {
    if (dx === 0 && dy === 0) return OCT[0];
    let oct = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
    if (oct < 0) oct += 8;
    if (oct === 8) oct = 0;
    return OCT[oct];
  }
  function rngSeed(n) {
    let a = (n >>> 0) || 1;
    return function () {
      a |= 0;
      a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function circleRect(cx, cy, rad, rx, ry, rw, rh) {
    const nx = clamp(cx, rx, rx + rw);
    const ny = clamp(cy, ry, ry + rh);
    const dx = cx - nx;
    const dy = cy - ny;
    return dx * dx + dy * dy < rad * rad;
  }
  function isBorder(c, r) {
    return c <= 0 || r <= 0 || c >= COLS - 1 || r >= ROWS - 1;
  }

  function cellAt(x, y) {
    const c = x | 0;
    const r = y | 0;
    if (!inb(c, r)) return WALL;
    return G.grid[idx(c, r)];
  }

  function blocked(x, y, rad, ghost) {
    const c0 = Math.max(0, (x - rad) | 0);
    const r0 = Math.max(0, (y - rad) | 0);
    const c1 = Math.min(COLS - 1, (x + rad) | 0);
    const r1 = Math.min(ROWS - 1, (y + rad) | 0);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const t = G.grid[idx(c, r)];
        const wall = t === WALL && (!ghost || isBorder(c, r));
        if (wall && circleRect(x, y, rad, c, r, 1, 1)) return true;
      }
    }
    return false;
  }

  function floodReach(grid, sc, sr) {
    const seen = new Uint8Array(COLS * ROWS);
    const q = [sc, sr];
    seen[idx(sc, sr)] = 1;
    let qi = 0;
    while (qi < q.length) {
      const c = q[qi++];
      const r = q[qi++];
      for (let d = 0; d < 4; d++) {
        const nc = c + DX[d];
        const nr = r + DY[d];
        if (!inb(nc, nr) || seen[idx(nc, nr)]) continue;
        if (grid[idx(nc, nr)] === WALL) continue;
        seen[idx(nc, nr)] = 1;
        q.push(nc, nr);
      }
    }
    return seen;
  }

  function carveCell(grid, c, r) {
    if (c > 0 && r > 0 && c < COLS - 1 && r < ROWS - 1) {
      if (grid[idx(c, r)] === WALL) grid[idx(c, r)] = EMPTY;
    }
  }

  function carveRoom(grid, rm) {
    for (let r = rm.r; r < rm.r + rm.h; r++) {
      for (let c = rm.c; c < rm.c + rm.w; c++) carveCell(grid, c, r);
    }
  }

  function carveH(grid, c0, c1, r) {
    const a = Math.min(c0, c1);
    const b = Math.max(c0, c1);
    for (let c = a; c <= b; c++) carveCell(grid, c, r);
  }

  function carveV(grid, r0, r1, c) {
    const a = Math.min(r0, r1);
    const b = Math.max(r0, r1);
    for (let r = a; r <= b; r++) carveCell(grid, c, r);
  }

  function carveLine(grid, c0, r0, c1, r1) {
    let c = c0 | 0;
    let r = r0 | 0;
    const tc = c1 | 0;
    const tr = r1 | 0;
    let guard = 80;
    while ((c !== tc || r !== tr) && guard-- > 0) {
      if (c !== tc) c += tc > c ? 1 : -1;
      else r += tr > r ? 1 : -1;
      carveCell(grid, c, r);
    }
  }

  function carveCorridor(grid, x0, y0, x1, y1, rng) {
    const c0 = x0 | 0;
    const r0 = y0 | 0;
    const c1 = x1 | 0;
    const r1 = y1 | 0;
    if (rng() < 0.5) {
      carveH(grid, c0, c1, r0);
      carveV(grid, r0, r1, c1);
    } else {
      carveV(grid, r0, r1, c0);
      carveH(grid, c0, c1, r1);
    }
  }

  function overlapRoom(a, b) {
    return a.c < b.c + b.w + 1 && a.c + a.w + 1 > b.c &&
      a.r < b.r + b.h + 1 && a.r + a.h + 1 > b.r;
  }

  function fallbackMaze(grid) {
    grid.fill(WALL);
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) grid[idx(c, r)] = EMPTY;
    }
    const rooms = [
      { c: 1, r: 4, w: 4, h: 5 },
      { c: 8, r: 1, w: 5, h: 4 },
      { c: 8, r: 8, w: 5, h: 4 },
      { c: 16, r: 4, w: 4, h: 5 }
    ];
    for (let i = 0; i < rooms.length; i++) carveRoom(grid, rooms[i]);
    carveH(grid, 3, 17, 6);
    carveV(grid, 2, 10, 10);
    return rooms;
  }

  function genMaze(seed, spec) {
    const rng = rngSeed(seed);
    const grid = new Uint8Array(COLS * ROWS);
    grid.fill(WALL);
    const rooms = [];
    const startH = 4 + (rng() * 2) | 0;
    const startR = 1 + ((ROWS - 2 - startH) * rng()) | 0;
    rooms.push({ c: 1, r: startR, w: 4, h: startH });
    carveRoom(grid, rooms[0]);

    const want = spec.rooms || 5;
    let tries = 0;
    while (rooms.length < want && tries < 90) {
      tries += 1;
      const w = 3 + (rng() * 4) | 0;
      const h = 3 + (rng() * 3) | 0;
      const c = 1 + (rng() * Math.max(1, COLS - 2 - w)) | 0;
      const r = 1 + (rng() * Math.max(1, ROWS - 2 - h)) | 0;
      const rm = { c: c, r: r, w: w, h: h };
      let ok = true;
      for (let i = 0; i < rooms.length; i++) {
        if (overlapRoom(rm, rooms[i])) { ok = false; break; }
      }
      if (!ok) continue;
      carveRoom(grid, rm);
      rooms.push(rm);
    }

    if (rooms.length < 3) {
      const extra = fallbackMaze(grid);
      for (let i = 0; i < extra.length; i++) rooms.push(extra[i]);
    }

    for (let i = 1; i < rooms.length; i++) {
      const a = rooms[i - 1];
      const b = rooms[i];
      carveCorridor(grid, a.c + a.w * 0.5, a.r + a.h * 0.5, b.c + b.w * 0.5, b.r + b.h * 0.5, rng);
    }
    if (rooms.length > 2) {
      const a = rooms[0];
      const b = rooms[rooms.length - 1];
      carveCorridor(grid, a.c + a.w * 0.5, a.r + a.h * 0.5, b.c + b.w * 0.5, b.r + b.h * 0.5, rng);
    }

    for (let i = 0; i < rooms.length; i++) {
      const rm = rooms[i];
      if (rm.w >= 5 && rm.h >= 4 && rng() < 0.45) {
        const pc = rm.c + 1 + ((rm.w - 3) * rng()) | 0;
        const pr = rm.r + 1 + ((rm.h - 3) * rng()) | 0;
        if (!isBorder(pc, pr)) grid[idx(pc, pr)] = WALL;
      }
    }

    for (let c = 0; c < COLS; c++) {
      grid[idx(c, 0)] = WALL;
      grid[idx(c, ROWS - 1)] = WALL;
    }
    for (let r = 0; r < ROWS; r++) {
      grid[idx(0, r)] = WALL;
      grid[idx(COLS - 1, r)] = WALL;
    }

    const sc = rooms[0].c + 1;
    const sr = rooms[0].r + ((rooms[0].h * 0.5) | 0);
    carveCell(grid, sc, sr);
    let seen = floodReach(grid, sc, sr);
    for (let i = 1; i < rooms.length; i++) {
      const tc = rooms[i].c + ((rooms[i].w * 0.5) | 0);
      const tr = rooms[i].r + ((rooms[i].h * 0.5) | 0);
      carveCell(grid, tc, tr);
      if (!seen[idx(tc, tr)]) {
        carveLine(grid, sc, sr, tc, tr);
        seen = floodReach(grid, sc, sr);
      }
    }
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (grid[idx(c, r)] === WALL) continue;
        if (!seen[idx(c, r)]) {
          carveLine(grid, sc, sr, c, r);
          seen = floodReach(grid, sc, sr);
        }
      }
    }
    for (let c = 0; c < COLS; c++) {
      grid[idx(c, 0)] = WALL;
      grid[idx(c, ROWS - 1)] = WALL;
    }
    for (let r = 0; r < ROWS; r++) {
      grid[idx(0, r)] = WALL;
      grid[idx(COLS - 1, r)] = WALL;
    }
    return { grid: grid, rooms: rooms, sc: sc, sr: sr, seen: floodReach(grid, sc, sr) };
  }

  function mazeOk(pack) {
    const g = pack.grid;
    if (g[idx(0, 0)] !== WALL) return false;
    if (g[idx(pack.sc, pack.sr)] === WALL) return false;
    let empties = 0;
    let exits = 0;
    for (let i = 0; i < g.length; i++) {
      if (g[i] !== WALL) empties += 1;
      if (g[i] === EXIT) exits += 1;
    }
    if (empties < 40) return false;
    const seen = pack.seen || floodReach(g, pack.sc, pack.sr);
    if (exits) {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (g[idx(c, r)] === EXIT && !seen[idx(c, r)]) return false;
        }
      }
    }
    return seen[idx(pack.sc, pack.sr)] === 1;
  }

  function specNow() {
    if (G.kind === 'campaign') return FLOORS[Math.min(G.stage, FLOORS.length - 1)];
    const w = G.wave;
    const g = Math.min(8, 2 + ((w * 0.55) | 0));
    const ghost = Math.min(3, (w / 2) | 0);
    const demon = Math.min(3, ((w - 1) / 2) | 0);
    const grunt = Math.max(1, g - ghost - demon);
    return {
      name: '第 ' + w + ' 层',
      gens: g,
      grunt: grunt,
      ghost: ghost,
      demon: demon,
      spawn: Math.max(0.72, 2.4 - (w - 1) * 0.12),
      drain: Math.min(9.2, 5.5 + (w - 1) * 0.22),
      food: Math.min(7, 3 + ((w + 1) / 2 | 0)),
      loot: Math.min(6, 3 + ((w) / 2 | 0)),
      pot: w % 2 === 0 ? 2 : 1,
      hp: Math.min(8, 4 + ((w - 1) / 2 | 0)),
      rooms: Math.min(6, 4 + ((w - 1) / 3 | 0))
    };
  }

  function selfCheck() {
    const s = snap8(10, 0);
    if (s[0] !== 1 || s[1] !== 0) throw new Error('snap8 east');
    const n = snap8(0, -4);
    if (n[0] !== 0 || n[1] !== -1) throw new Error('snap8 north');
    const ne = snap8(3, -3);
    if (ne[0] !== 1 || ne[1] !== -1) throw new Error('snap8 ne');
    if (idx(2, 1) !== COLS + 2) throw new Error('idx');
    for (let i = 0; i < 40; i++) {
      const spec = FLOORS[i % FLOORS.length];
      const pack = genMaze(17 * i + 9, spec);
      const far = farthestCell(pack);
      pack.grid[idx(far.c, far.r)] = EXIT;
      pack.seen = floodReach(pack.grid, pack.sc, pack.sr);
      if (!mazeOk(pack)) throw new Error('maze connectivity seed ' + i);
      if (pack.grid[idx(far.c, far.r)] !== EXIT) throw new Error('exit missing ' + i);
      if (!pack.seen[idx(far.c, far.r)]) throw new Error('exit unreachable ' + i);
    }
    return true;
  }

  function farthestCell(pack) {
    const seen = pack.seen;
    let bestC = pack.sc;
    let bestR = pack.sr;
    let best = -1;
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (!seen[idx(c, r)]) continue;
        if (pack.grid[idx(c, r)] === WALL) continue;
        const d = (c - pack.sc) * (c - pack.sc) + (r - pack.sr) * (r - pack.sr);
        if (d > best) {
          best = d;
          bestC = c;
          bestR = r;
        }
      }
    }
    return { c: bestC, r: bestR };
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
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (err) { /* ignore */ }
    },
    beep(freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted) return;
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
      f.frequency.value = hp || 700;
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
    zap() {
      this.ensure();
      this.beep(920, 0.05, 'square', 0.046, 280);
      this.beep(1480, 0.035, 'sawtooth', 0.028, 640);
    },
    zapPow() {
      this.ensure();
      this.beep(1240, 0.06, 'square', 0.05, 420);
      this.beep(1760, 0.05, 'triangle', 0.03, 880);
    },
    boom() {
      this.ensure();
      this.noise(0.11, 0.055, 260);
      this.beep(210, 0.13, 'sawtooth', 0.048, 58);
    },
    genBoom() {
      this.ensure();
      this.noise(0.18, 0.07, 180);
      this.beep(140, 0.22, 'sawtooth', 0.06, 46);
      this.beep(330, 0.1, 'square', 0.035, 110);
    },
    wall() {
      this.ensure();
      this.noise(0.045, 0.03, 900);
      this.beep(380, 0.035, 'triangle', 0.02, 140);
    },
    food() {
      this.ensure();
      this.beep(520, 0.07, 'sine', 0.045, 780);
      this.beep(780, 0.1, 'triangle', 0.035);
    },
    loot() {
      this.ensure();
      this.beep(660, 0.06, 'square', 0.04, 880);
      this.beep(990, 0.1, 'triangle', 0.04);
      this.beep(1320, 0.08, 'sine', 0.03);
    },
    potion() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 784);
      this.beep(784, 0.12, 'triangle', 0.04);
      this.beep(1046, 0.16, 'sine', 0.045);
    },
    waste() {
      this.ensure();
      this.beep(240, 0.1, 'sawtooth', 0.035, 90);
    },
    combo(n) {
      this.ensure();
      const f = 520 + Math.min(8, n) * 70;
      this.beep(f, 0.07, 'square', 0.04, f * 1.5);
    },
    hurt() {
      this.ensure();
      this.beep(170, 0.14, 'sawtooth', 0.05, 64);
      this.noise(0.1, 0.045, 380);
    },
    heart() {
      this.ensure();
      this.beep(180, 0.06, 'sine', 0.04, 90);
    },
    exit() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 660);
      this.beep(784, 0.12, 'triangle', 0.035);
    },
    spawn() {
      this.ensure();
      this.beep(220, 0.06, 'triangle', 0.025, 140);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.05);
      this.beep(659, 0.12, 'sine', 0.045);
      this.beep(784, 0.16, 'sine', 0.05);
      this.beep(1046, 0.26, 'triangle', 0.05, 1560);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.045, 90);
      this.beep(140, 0.3, 'sine', 0.05, 50);
    },
    start() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 784);
    }
  };

  const canvas = el('c');
  const ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;
  const overlay = el('overlay');
  const panel = el('panel');
  const ovKicker = el('ov-kicker');
  const ovTitle = el('ov-title');
  const ovLead = el('ov-lead');
  const ovOps = el('ov-ops');
  const ovStart = el('ov-start');
  const ovEnd = el('ov-end');
  const btnCampaign = el('btn-campaign');
  const btnEndless = el('btn-endless');
  const ovAgain = el('ov-again');
  const ovMenu = el('ov-menu');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
  const modeCamp = el('mode-camp');
  const modeEnd = el('mode-end');
  const scoreEl = el('score');
  const bestEl = el('best');
  const scoreBox = el('score-box');
  const scoreAdd = el('score-add');
  const comboEl = el('combo');
  const comboBox = el('combo-box');
  const hpEl = el('hp');
  const hpBox = el('hp-box');
  const hpFill = el('hp-fill');
  const stageLabel = el('stage-label');
  const tagLabel = el('tag-label');
  const toastEl = el('toast');
  const chainPop = el('chain-pop');
  const hintEl = el('hint');
  const stageEl = el('stage');
  const padEl = el('pad');
  const padBtns = {
    up: el('btn-up'),
    down: el('btn-down'),
    left: el('btn-left'),
    right: el('btn-right'),
    fire: el('btn-fire')
  };

  let W = 1;
  let H = 1;
  let dpr = 1;
  let cell = 32;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let chainTok = 0;
  let fireHold = false;

  const keys = { u: false, d: false, l: false, r: false };
  const ptr = { down: false, id: null, sx: 0, sy: 0, x: 0, y: 0, dragging: false, dx: 0, dy: 0 };
  const particles = [];
  const pops = [];
  const motes = [];
  const lasers = [];
  const rings = [];

  const G = {
    mode: 'title',
    kind: 'campaign',
    t: 0,
    clock: 0,
    stage: 0,
    wave: 1,
    floorId: 1,
    hp: HP_START,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    grid: new Uint8Array(COLS * ROWS),
    gens: [],
    mons: [],
    shots: [],
    player: { x: 2.5, y: 6.5, fx: 1, fy: 0, walk: 0, fireCd: 0 },
    startC: 2,
    startR: 6,
    exitC: 18,
    exitR: 6,
    spawnInt: 2.2,
    drain: 4.4,
    genHp: 4,
    startGens: 0,
    powerT: 0,
    hurtCd: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    toastT: 0,
    deadT: 0,
    ready: 0,
    why: '',
    punch: 1,
    heartT: 0,
    lowWarned: false,
    dustT: 0,
    cleared: false
  };

  if (!hasDom) {
    selfCheck();
    return;
  }

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

  function addScore(n, x, y) {
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    if (scoreBox && scoreAdd) {
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
    if (x != null) spawnPop(x, y, '+' + n, GOLD);
  }

  function toast(msg, warn, gold) {
    G.toastT = 1.45;
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

  function syncModes() {
    if (modeCamp) modeCamp.setAttribute('aria-pressed', G.kind === 'campaign' ? 'true' : 'false');
    if (modeEnd) modeEnd.setAttribute('aria-pressed', G.kind === 'endless' ? 'true' : 'false');
  }

  function liveGens() {
    let n = 0;
    for (let i = 0; i < G.gens.length; i++) if (G.gens[i].alive) n += 1;
    return n;
  }

  function liveMons() {
    let n = 0;
    for (let i = 0; i < G.mons.length; i++) if (G.mons[i].alive) n += 1;
    return n;
  }

  function playerShots() {
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) if (G.shots[i].from === 'p') n += 1;
    return n;
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && G.comboT > 0);
    const hpShow = Math.max(0, Math.ceil(G.hp));
    if (hpEl) hpEl.textContent = String(hpShow);
    if (hpFill) hpFill.style.transform = 'scaleX(' + clamp(G.hp / HP_MAX, 0, 1) + ')';
    if (hpBox) {
      hpBox.classList.toggle('low', G.hp > 0 && G.hp < HP_LOW);
      hpBox.classList.toggle('power', G.powerT > 0);
    }
    if (stageLabel) {
      if (G.kind === 'endless') {
        stageLabel.textContent = G.mode === 'title' ? '无尽' : ('无尽 第 ' + G.wave + ' 层');
      } else {
        const st = FLOORS[Math.min(G.stage, FLOORS.length - 1)];
        stageLabel.textContent = G.mode === 'title'
          ? '地牢'
          : ('地牢 ' + (G.stage + 1) + '/' + FLOORS.length + ' · ' + st.name);
      }
      stageLabel.classList.toggle('hot', G.combo >= 3);
    }
    if (tagLabel) {
      if (G.hp > 0 && G.hp < HP_LOW && G.mode === 'play') {
        tagLabel.textContent = '生命将尽';
        tagLabel.className = 'warn';
      } else if (G.powerT > 0) {
        tagLabel.textContent = '药 ' + G.powerT.toFixed(1) + 's';
        tagLabel.className = 'hot';
      } else {
        tagLabel.textContent = '发生器 ' + liveGens();
        tagLabel.className = '';
      }
    }
    syncModes();
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
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
      if (ovKicker) ovKicker.textContent = 'GAUNT';
      if (ovTitle) ovTitle.textContent = '魔宫';
      if (ovLead) ovLead.innerHTML = '迷宫里开火打发生器，抢走食物和宝藏。<br />生命一直在掉，找到出口进下一层。';
      if (ovOps) ovOps.textContent = OPS;
    } else if (kind === 'win') {
      if (ovKicker) ovKicker.textContent = 'CLEAR';
      if (ovTitle) ovTitle.textContent = '闯出魔宫';
      if (ovLead) ovLead.textContent = '八层都跑出来了。分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '');
      if (ovOps) ovOps.textContent = 'R 重开随时可用';
      if (ovAgain) ovAgain.textContent = '再来一轮';
      if (ovMenu) ovMenu.textContent = '换模式';
    } else {
      if (ovKicker) ovKicker.textContent = 'DOWN';
      if (ovTitle) ovTitle.textContent = G.why || '命尽了';
      const tail = G.kind === 'endless' ? ('撑到第 ' + G.wave + ' 层。') : ('停在第 ' + (G.stage + 1) + ' 层。');
      if (ovLead) ovLead.textContent = tail + '分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '');
      if (ovOps) ovOps.textContent = 'R 重开随时可用';
      if (ovAgain) ovAgain.textContent = '再来';
      if (ovMenu) ovMenu.textContent = '换模式';
    }
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

  function screenFlash(rgb, a) {
    G.flash = a;
    G.flashRgb = rgb;
  }

  function emit(n, spec) {
    if (REDUCE) n = Math.min(n, 6);
    for (let i = 0; i < n; i++) {
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
    pops.push({ x: x, y: y, text: text, rgb: rgb, t: 0.85, life: 0.85 });
  }

  function spawnRing(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb });
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

  function bumpCombo() {
    const prev = G.mult;
    G.combo += 1;
    G.comboT = COMBO_WIN;
    G.mult = 1 + Math.min(4, G.combo >> 1);
    if (G.combo >= 2) audio.combo(G.combo);
    if (G.mult > prev) showChain(G.mult);
  }

  function resetFx() {
    particles.length = 0;
    pops.length = 0;
    lasers.length = 0;
    rings.length = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
  }

  function typeRgb(kind) {
    if (kind === 'ghost') return MAG;
    if (kind === 'demon') return TYPE.demon.rgb;
    return HOT2;
  }

  function openCells(seen) {
    const list = [];
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (G.grid[idx(c, r)] !== EMPTY) continue;
        if (seen && !seen[idx(c, r)]) continue;
        list.push(c, r);
      }
    }
    return list;
  }

  function genAt(c, r) {
    for (let i = 0; i < G.gens.length; i++) {
      const g = G.gens[i];
      if (!g.alive) continue;
      if ((g.x | 0) === c && (g.y | 0) === r) return g;
    }
    return null;
  }

  function takeCell(list, rng, avoidX, avoidY, minD) {
    const md = minD || 2.4;
    const md2 = md * md;
    let tries = list.length / 2;
    while (tries-- > 0 && list.length) {
      const k = ((rng() * (list.length / 2)) | 0) * 2;
      const c = list[k];
      const r = list[k + 1];
      list[k] = list[list.length - 2];
      list[k + 1] = list[list.length - 1];
      list.length -= 2;
      const dx = c + 0.5 - avoidX;
      const dy = r + 0.5 - avoidY;
      if (dx * dx + dy * dy < md2) continue;
      if (G.grid[idx(c, r)] !== EMPTY) continue;
      if (genAt(c, r)) continue;
      return { c: c, r: r };
    }
    return null;
  }

  function placeItems(spec, seen, rng, px, py) {
    const cells = openCells(seen);
    let n = spec.food;
    while (n-- > 0) {
      const p = takeCell(cells, rng, px, py, 2.2);
      if (!p) break;
      G.grid[idx(p.c, p.r)] = FOOD;
    }
    n = spec.loot;
    while (n-- > 0) {
      const p = takeCell(cells, rng, px, py, 2.4);
      if (!p) break;
      G.grid[idx(p.c, p.r)] = LOOT;
    }
    n = spec.pot;
    while (n-- > 0) {
      const p = takeCell(cells, rng, px, py, 3);
      if (!p) break;
      G.grid[idx(p.c, p.r)] = POTION;
    }
  }

  function placeGens(spec, seen, rng, px, py) {
    G.gens = [];
    const types = [];
    for (let i = 0; i < spec.grunt; i++) types.push('grunt');
    for (let i = 0; i < spec.ghost; i++) types.push('ghost');
    for (let i = 0; i < spec.demon; i++) types.push('demon');
    while (types.length < spec.gens) types.push('grunt');
    for (let i = types.length - 1; i > 0; i--) {
      const j = (rng() * (i + 1)) | 0;
      const tmp = types[i];
      types[i] = types[j];
      types[j] = tmp;
    }
    const cells = openCells(seen);
    const n = Math.min(spec.gens, types.length);
    for (let i = 0; i < n; i++) {
      const p = takeCell(cells, rng, px, py, 3.6);
      if (!p) break;
      const kind = types[i];
      G.gens.push({
        x: p.c + 0.5,
        y: p.r + 0.5,
        kind: kind,
        hp: spec.hp,
        maxHp: spec.hp,
        cd: rand(0.35, spec.spawn * 0.7),
        kids: 0,
        rgb: typeRgb(kind),
        alive: true,
        pulse: rng() * TAU
      });
    }
    if (G.gens.length === 0) {
      const p = takeCell(openCells(seen), rng, px, py, 2.8);
      if (p) {
        G.gens.push({
          x: p.c + 0.5,
          y: p.r + 0.5,
          kind: 'grunt',
          hp: spec.hp,
          maxHp: spec.hp,
          cd: rand(0.3, 0.8),
          kids: 0,
          rgb: typeRgb('grunt'),
          alive: true,
          pulse: rng() * TAU
        });
      }
    }
    G.startGens = G.gens.length;
  }

  function spawnMon(kind, x, y, parent) {
    const cap = G.kind === 'endless' ? MAX_MON_END : MAX_MON;
    if (liveMons() >= cap) return null;
    const t = TYPE[kind] || TYPE.grunt;
    const face = snap8(G.player.x - x, G.player.y - y);
    const mon = {
      x: x,
      y: y,
      fx: face[0],
      fy: face[1],
      kind: kind,
      r: t.r,
      hp: t.hp,
      cd: kind === 'demon' ? rand(0.4, 1.1) : 0,
      thinkT: rand(0, 0.18),
      walk: rand(0, TAU),
      rgb: t.rgb,
      alive: true,
      parent: parent || null
    };
    G.mons.push(mon);
    if (parent) parent.kids += 1;
    return mon;
  }

  function seedMons(rng) {
    for (let i = 0; i < G.gens.length; i++) {
      const g = G.gens[i];
      const n = 1 + (rng() < 0.45 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        const ang = rng() * TAU;
        const d = 0.85 + rng() * 0.4;
        const x = g.x + Math.cos(ang) * d;
        const y = g.y + Math.sin(ang) * d;
        if (blocked(x, y, M_R, g.kind === 'ghost')) continue;
        if (hypot(x - G.player.x, y - G.player.y) < 3.2) continue;
        spawnMon(g.kind, x, y, g);
      }
    }
  }

  function buildFloor() {
    const spec = specNow();
    const seed0 = G.floorId * 7919 + (G.kind === 'endless' ? 17 : 5) + G.wave * 13 + G.stage * 29;
    let pack = genMaze(seed0, spec);
    for (let a = 1; a < 8 && !mazeOk(pack); a++) {
      pack = genMaze(seed0 + a * 97, spec);
    }
    if (!mazeOk(pack)) {
      const grid = new Uint8Array(COLS * ROWS);
      const rooms = fallbackMaze(grid);
      pack = {
        grid: grid,
        rooms: rooms,
        sc: rooms[0].c + 1,
        sr: rooms[0].r + 2,
        seen: floodReach(grid, rooms[0].c + 1, rooms[0].r + 2)
      };
    }
    G.grid = pack.grid;
    G.startC = pack.sc;
    G.startR = pack.sr;
    const far = farthestCell(pack);
    G.exitC = far.c;
    G.exitR = far.r;
    if (G.exitC === G.startC && G.exitR === G.startR) {
      for (let r = ROWS - 2; r >= 1 && G.exitC === G.startC && G.exitR === G.startR; r--) {
        for (let c = COLS - 2; c >= 1; c--) {
          if (G.grid[idx(c, r)] === WALL) continue;
          if (c === G.startC && r === G.startR) continue;
          if (!pack.seen[idx(c, r)]) continue;
          G.exitC = c;
          G.exitR = r;
          break;
        }
      }
    }
    G.grid[idx(G.exitC, G.exitR)] = EXIT;
    G.player.x = G.startC + 0.5;
    G.player.y = G.startR + 0.5;
    G.player.fx = 1;
    G.player.fy = 0;
    G.player.fireCd = 0;
    G.spawnInt = spec.spawn;
    G.drain = spec.drain;
    G.genHp = spec.hp;
    G.mons = [];
    G.shots = [];
    G.cleared = false;
    const rng = rngSeed(seed0 ^ 0x9E3779B9);
    placeGens(spec, pack.seen, rng, G.player.x, G.player.y);
    placeItems(spec, pack.seen, rng, G.player.x, G.player.y);
    seedMons(rng);
    G.ready = 0.38;
    G.invuln = 0.5;
    G.hurtCd = 0;
    resetFx();
  }

  function startGame(kind) {
    G.kind = kind === 'endless' ? 'endless' : 'campaign';
    G.mode = 'play';
    G.stage = 0;
    G.wave = 1;
    G.floorId = 1;
    G.hp = HP_START;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.deadT = 0;
    G.powerT = 0;
    G.why = '';
    G.lowWarned = false;
    buildFloor();
    hideOverlay();
    audio.start();
    const spec = specNow();
    toast(G.kind === 'endless' ? '无尽 · 更密更快' : ('地牢 · ' + spec.name), false, G.kind !== 'endless');
    setHint(G.kind === 'endless' ? '无尽层 · 发生器更密 · 生命掉得更快' : '打发生器 · 抢食物 · 出口进下层', G.kind === 'endless' ? 'warn' : '');
    syncHud();
  }

  function startCampaign() { startGame('campaign'); }
  function startEndless() { startGame('endless'); }

  function bootTitle() {
    G.mode = 'title';
    G.kind = 'campaign';
    G.stage = 0;
    G.wave = 1;
    G.floorId = 1;
    G.hp = HP_START;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.powerT = 0;
    buildFloor();
    G.invuln = 99;
    showOverlay('title');
    setHint('打发生器 · 抢食物 · 生命一直掉 · 出口进下层');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') {
      startCampaign();
      return;
    }
    startGame(G.kind);
  }

  function winRun() {
    if (G.mode !== 'play') return;
    const bonus = Math.ceil(G.hp) * 10;
    if (bonus > 0) addScore(bonus, G.player.x, G.player.y);
    G.mode = 'win';
    audio.win();
    kick('win-flash');
    screenFlash(GOLD, 0.45);
    hitStop(0.08);
    showOverlay('win');
    setHint('闯出魔宫 · R 再来', 'hot');
    syncHud();
  }

  function loseRun(why) {
    if (G.mode !== 'play') return;
    G.mode = 'lose';
    G.why = why;
    G.hp = 0;
    fireHold = false;
    audio.lose();
    kick('die');
    screenFlash(MAG, 0.5);
    hitStop(0.08);
    showOverlay('lose');
    setHint('R 重开随时可用', 'warn');
    syncHud();
  }

  function hurtPlayer(n, why) {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    G.hp -= n;
    G.hurtCd = CONTACT_CD;
    audio.hurt();
    kick('die');
    screenFlash(MAG, 0.32);
    hitStop(0.045);
    G.shake = Math.max(G.shake, 6);
    G.punch = 0.97;
    emit(14, {
      x: G.player.x, y: G.player.y, j: 0.12,
      vx0: -6, vx1: 6, vy0: -7, vy1: 4,
      life: 0.32, r0: 0.03, r1: 0.1, rgb: CYN, g: 5
    });
    spawnRing(G.player.x, G.player.y, MAG);
    G.why = why;
    if (G.hp <= 0) {
      G.hp = 0;
      G.deadT = 0.55;
      toast(why, true, false);
    }
    syncHud();
  }

  function killMon(mon) {
    if (!mon.alive) return;
    mon.alive = false;
    if (mon.parent && mon.parent.kids > 0) mon.parent.kids -= 1;
    audio.boom();
    emit(16, {
      x: mon.x, y: mon.y, j: 0.14,
      vx0: -8, vx1: 8, vy0: -9, vy1: 5,
      life: 0.4, r0: 0.03, r1: 0.12, rgb: mon.rgb, g: 7
    });
    spawnRing(mon.x, mon.y, mon.rgb);
    if (G.mode !== 'play') return;
    const t = TYPE[mon.kind] || TYPE.grunt;
    bumpCombo();
    addScore(t.score * G.mult, mon.x, mon.y);
    hitStop(0.034 + Math.min(0.042, G.combo * 0.005));
    G.shake = Math.max(G.shake, 4 + Math.min(4, G.combo));
    G.punch = 0.972;
    kick('boom');
  }

  function checkClear() {
    if (G.cleared || G.mode !== 'play') return;
    if (liveGens() > 0) return;
    G.cleared = true;
    const bonus = 150 + 30 * G.startGens;
    addScore(bonus, G.player.x, G.player.y - 0.55);
    toast('发生器清光 · 找出口', false, true);
    audio.exit();
    kick('win-flash');
  }

  function killGen(gen) {
    if (!gen.alive) return;
    gen.alive = false;
    audio.genBoom();
    emit(26, {
      x: gen.x, y: gen.y, j: 0.2,
      vx0: -9, vx1: 9, vy0: -10, vy1: 6,
      life: 0.52, r0: 0.04, r1: 0.14, rgb: gen.rgb, g: 8
    });
    spawnRing(gen.x, gen.y, GOLD);
    if (G.mode === 'play') {
      bumpCombo();
      addScore(200 * G.mult, gen.x, gen.y);
      hitStop(0.062);
      G.shake = Math.max(G.shake, 8);
      G.punch = 0.955;
      kick('boom');
      screenFlash(gen.rgb, 0.28);
      if (Math.random() < 0.28) {
        const c = gen.x | 0;
        const r = gen.y | 0;
        if (inb(c, r) && G.grid[idx(c, r)] === EMPTY) G.grid[idx(c, r)] = FOOD;
      } else if (Math.random() < 0.22) {
        const c = gen.x | 0;
        const r = gen.y | 0;
        if (inb(c, r) && G.grid[idx(c, r)] === EMPTY) G.grid[idx(c, r)] = LOOT;
      }
      checkClear();
    }
  }

  function hitGen(gen, dmg) {
    if (!gen.alive) return;
    gen.hp -= dmg;
    emit(6, {
      x: gen.x, y: gen.y, j: 0.1,
      vx0: -3, vx1: 3, vy0: -4, vy1: 2,
      life: 0.18, r0: 0.03, r1: 0.07, rgb: gen.rgb, g: 2
    });
    if (gen.hp <= 0) killGen(gen);
    else {
      audio.wall();
      hitStop(0.022);
      G.punch = 0.985;
    }
  }

  function destroyPickup(c, r, shot) {
    const t = G.grid[idx(c, r)];
    G.grid[idx(c, r)] = EMPTY;
    audio.waste();
    const rgb = t === FOOD ? GRN : t === POTION ? PUR : GOLD;
    emit(8, {
      x: c + 0.5, y: r + 0.5, j: 0.08,
      vx0: -3, vx1: 3, vy0: -4, vy1: 2,
      life: 0.22, r0: 0.03, r1: 0.08, rgb: rgb, g: 3
    });
    spawnPop(c + 0.5, r + 0.35, '毁了', MAG);
    if (shot) {
      shot.dead = true;
    }
  }

  function grabCell(c, r) {
    if (!inb(c, r)) return;
    const t = G.grid[idx(c, r)];
    if (t !== FOOD && t !== LOOT && t !== POTION) return;
    G.grid[idx(c, r)] = EMPTY;
    const x = c + 0.5;
    const y = r + 0.5;
    if (t === FOOD) {
      const before = G.hp;
      G.hp = Math.min(HP_MAX, G.hp + HP_FOOD);
      const got = Math.round(G.hp - before);
      audio.food();
      spawnPop(x, y, '生命+' + got, GRN);
      emit(10, {
        x: x, y: y, j: 0.1,
        vx0: -3, vx1: 3, vy0: -5, vy1: -1,
        life: 0.32, r0: 0.03, r1: 0.08, rgb: GRN, g: 2
      });
      spawnRing(x, y, GRN);
      if (G.hp >= HP_LOW) G.lowWarned = false;
    } else if (t === LOOT) {
      audio.loot();
      bumpCombo();
      addScore(120 * G.mult, x, y);
      emit(12, {
        x: x, y: y, j: 0.12,
        vx0: -4, vx1: 4, vy0: -6, vy1: 1,
        life: 0.36, r0: 0.03, r1: 0.09, rgb: GOLD, g: 3
      });
      spawnRing(x, y, GOLD);
    } else {
      audio.potion();
      G.powerT = POW_TIME;
      addScore(50, x, y);
      spawnPop(x, y, '魔力', PUR);
      toast('魔力爆发', false, true);
      screenFlash(GOLD, 0.4);
      hitStop(0.07);
      kick('win-flash');
      spawnRing(x, y, PUR);
      emit(22, {
        x: x, y: y, j: 0.2,
        vx0: -8, vx1: 8, vy0: -8, vy1: 6,
        life: 0.45, r0: 0.04, r1: 0.12, rgb: PUR, g: 4
      });
      for (let i = 0; i < G.mons.length; i++) {
        const m = G.mons[i];
        if (!m.alive) continue;
        if (hypot(m.x - x, m.y - y) < 3.2) killMon(m);
      }
      for (let i = 0; i < G.gens.length; i++) {
        const g = G.gens[i];
        if (!g.alive) continue;
        if (hypot(g.x - x, g.y - y) < 2.6) hitGen(g, 2);
      }
    }
    G.punch = 0.978;
  }

  function nextFloor() {
    addScore(40);
    audio.exit();
    if (G.kind === 'campaign' && G.stage >= FLOORS.length - 1) {
      winRun();
      return;
    }
    if (G.kind === 'campaign') G.stage += 1;
    else G.wave += 1;
    G.floorId += 1;
    G.comboT = Math.max(G.comboT, 0.55);
    G.powerT = Math.max(0, G.powerT * 0.4);
    buildFloor();
    const spec = specNow();
    toast(G.kind === 'endless' ? spec.name : (spec.name + ' · 第 ' + (G.stage + 1) + ' 层'), false, true);
    kick('win-flash');
    screenFlash(CYN, 0.28);
    syncHud();
  }

  function firePlayer(dx, dy) {
    if (G.mode !== 'play' || G.deadT > 0 || G.ready > 0) return;
    if (G.player.fireCd > 0) return;
    const cap = G.powerT > 0 ? MAX_SHOTS_POW : MAX_SHOTS;
    if (playerShots() >= cap) return;
    const s = snap8(dx, dy);
    const len = hypot(s[0], s[1]) || 1;
    const ux = s[0] / len;
    const uy = s[1] / len;
    G.player.fx = s[0];
    G.player.fy = s[1];
    const pow = G.powerT > 0;
    G.shots.push({
      x: G.player.x + ux * 0.4,
      y: G.player.y + uy * 0.4,
      vx: ux * (pow ? P_SHOT * 1.12 : P_SHOT),
      vy: uy * (pow ? P_SHOT * 1.12 : P_SHOT),
      from: 'p',
      dmg: pow ? 2 : 1,
      rgb: pow ? GOLD : HOT2,
      power: pow,
      pierce: pow ? 1 : 0,
      dead: false
    });
    G.player.fireCd = pow ? FIRE_POW : FIRE_CD;
    if (pow) audio.zapPow();
    else audio.zap();
    screenFlash(pow ? GOLD : HOT, pow ? 0.16 : 0.1);
    G.punch = 0.986;
    lasers.push({
      x: G.player.x,
      y: G.player.y,
      ux: ux,
      uy: uy,
      t: 0.08,
      rgb: pow ? GOLD : HOT
    });
    emit(5, {
      x: G.player.x + ux * 0.38, y: G.player.y + uy * 0.38, j: 0.04,
      vx0: ux * 2, vx1: ux * 6, vy0: uy * 2, vy1: uy * 6,
      life: 0.14, r0: 0.03, r1: 0.07, rgb: pow ? GOLD : HOT, g: 0
    });
  }

  function fireDemon(mon) {
    if (mon.cd > 0) return;
    const s = snap8(G.player.x - mon.x, G.player.y - mon.y);
    const len = hypot(s[0], s[1]) || 1;
    const ux = s[0] / len;
    const uy = s[1] / len;
    mon.fx = s[0];
    mon.fy = s[1];
    G.shots.push({
      x: mon.x + ux * 0.36,
      y: mon.y + uy * 0.36,
      vx: ux * D_SHOT,
      vy: uy * D_SHOT,
      from: 'd',
      dmg: 15,
      rgb: MAG,
      power: false,
      pierce: 0,
      dead: false
    });
    mon.cd = G.kind === 'endless' ? rand(0.85, 1.25) : rand(1.05, 1.55);
    audio.beep(240, 0.07, 'sawtooth', 0.035, 110);
    lasers.push({ x: mon.x, y: mon.y, ux: ux, uy: uy, t: 0.06, rgb: MAG });
  }

  function tryMove(ent, dx, dy, rad, ghost) {
    const nx = ent.x + dx;
    const ny = ent.y + dy;
    if (!blocked(nx, ent.y, rad, ghost)) ent.x = nx;
    if (!blocked(ent.x, ny, rad, ghost)) ent.y = ny;
    ent.x = clamp(ent.x, 0.35, COLS - 0.35);
    ent.y = clamp(ent.y, 0.35, ROWS - 0.35);
  }

  function genBlocked(x, y, rad, skip) {
    for (let i = 0; i < G.gens.length; i++) {
      const g = G.gens[i];
      if (!g.alive || g === skip) continue;
      if (hypot(x - g.x, y - g.y) < rad + G_R * 0.85) return true;
    }
    return false;
  }

  function worldFromPtr(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (W / Math.max(1, rect.width));
    const y = (clientY - rect.top) * (H / Math.max(1, rect.height));
    return { x: (x - ox) / cell, y: (y - oy) / cell };
  }

  function playerDir() {
    let mx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
    let my = (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
    if (ptr.dragging) {
      mx = ptr.dx;
      my = ptr.dy;
    }
    return { mx: mx, my: my };
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    G.player.fireCd = Math.max(0, G.player.fireCd - dt);
    const dir = playerDir();
    let mx = dir.mx;
    let my = dir.my;
    if (mx || my) {
      const s = snap8(mx, my);
      const len = hypot(s[0], s[1]) || 1;
      mx = s[0] / len;
      my = s[1] / len;
      G.player.fx = s[0];
      G.player.fy = s[1];
      G.player.walk += dt * 14;
      const ox0 = G.player.x;
      const oy0 = G.player.y;
      tryMove(G.player, mx * P_SPD * dt, my * P_SPD * dt, P_R, false);
      if (genBlocked(G.player.x, G.player.y, P_R, null)) {
        G.player.x = ox0;
        G.player.y = oy0;
        tryMove(G.player, mx * P_SPD * dt, 0, P_R, false);
        if (genBlocked(G.player.x, G.player.y, P_R, null)) G.player.x = ox0;
        tryMove(G.player, 0, my * P_SPD * dt, P_R, false);
        if (genBlocked(G.player.x, G.player.y, P_R, null)) G.player.y = oy0;
      }
    }
    if (fireHold) firePlayer(G.player.fx, G.player.fy);

    const c = G.player.x | 0;
    const r = G.player.y | 0;
    grabCell(c, r);
    const t = cellAt(G.player.x, G.player.y);
    if (t === EXIT && G.ready <= 0) nextFloor();
  }

  function hasLOS(x0, y0, x1, y1) {
    const dist = hypot(x1 - x0, y1 - y0);
    const n = Math.max(2, dist / 0.22 | 0);
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      if (cellAt(x, y) === WALL) return false;
    }
    return true;
  }

  function steer(mon, wantX, wantY) {
    const ghost = mon.kind === 'ghost';
    let best = null;
    let bestDot = -999;
    const wx = wantX - mon.x;
    const wy = wantY - mon.y;
    const wl = hypot(wx, wy) || 1;
    const ux = wx / wl;
    const uy = wy / wl;
    for (let i = 0; i < 8; i++) {
      const f = OCT[i];
      const len = hypot(f[0], f[1]) || 1;
      const dx = f[0] / len;
      const dy = f[1] / len;
      const nx = mon.x + dx * 0.55;
      const ny = mon.y + dy * 0.55;
      if (blocked(nx, ny, mon.r, ghost)) continue;
      if (genBlocked(nx, ny, mon.r * 0.7, mon.parent)) continue;
      const dot = dx * ux + dy * uy;
      if (dot > bestDot) {
        bestDot = dot;
        best = f;
      }
    }
    if (best) {
      mon.fx = best[0];
      mon.fy = best[1];
    }
  }

  function updateGens(dt) {
    for (let i = 0; i < G.gens.length; i++) {
      const g = G.gens[i];
      if (!g.alive) continue;
      g.pulse += dt * 5;
      g.cd -= dt;
      if (g.cd > 0) continue;
      g.cd = G.spawnInt * rand(0.82, 1.18);
      if (g.kids >= 4) continue;
      const cap = G.kind === 'endless' ? MAX_MON_END : MAX_MON;
      if (liveMons() >= cap) continue;
      const ghost = g.kind === 'ghost';
      let born = null;
      for (let k = 0; k < 8 && !born; k++) {
        const ang = (k / 8) * TAU + Math.random() * 0.4;
        const x = g.x + Math.cos(ang) * 0.78;
        const y = g.y + Math.sin(ang) * 0.78;
        if (hypot(x - G.player.x, y - G.player.y) < 0.7) continue;
        if (blocked(x, y, M_R, ghost)) continue;
        born = spawnMon(g.kind, x, y, g);
      }
      if (born) {
        audio.spawn();
        emit(6, {
          x: born.x, y: born.y, j: 0.08,
          vx0: -2, vx1: 2, vy0: -3, vy1: 2,
          life: 0.22, r0: 0.03, r1: 0.07, rgb: g.rgb, g: 1
        });
      }
    }
  }

  function updateMons(dt) {
    const p = G.player;
    for (let i = 0; i < G.mons.length; i++) {
      const mon = G.mons[i];
      if (!mon.alive) continue;
      mon.cd = Math.max(0, mon.cd - dt);
      mon.thinkT -= dt;
      mon.walk += dt * (mon.kind === 'ghost' ? 7 : 11);
      const t = TYPE[mon.kind] || TYPE.grunt;
      let spd = t.spd + Math.min(0.7, (G.kind === 'endless' ? G.wave : G.stage) * 0.07);
      const dx = p.x - mon.x;
      const dy = p.y - mon.y;
      const dist = hypot(dx, dy);

      if (mon.kind === 'demon') {
        if (G.mode === 'play' && G.deadT <= 0 && G.ready <= 0 && mon.cd <= 0) {
          if (dist < 7 && hasLOS(mon.x, mon.y, p.x, p.y)) fireDemon(mon);
        }
        if (mon.thinkT <= 0) {
          mon.thinkT = 0.16 + Math.random() * 0.18;
          if (dist < 2.6) steer(mon, mon.x - dx, mon.y - dy);
          else if (dist > 4.6) steer(mon, p.x, p.y);
          else steer(mon, mon.x + dy, mon.y - dx);
        }
      } else if (mon.thinkT <= 0) {
        mon.thinkT = 0.12 + Math.random() * 0.16;
        steer(mon, p.x + rand(-0.2, 0.2), p.y + rand(-0.2, 0.2));
      }

      const len = hypot(mon.fx, mon.fy) || 1;
      const ghost = mon.kind === 'ghost';
      tryMove(mon, mon.fx / len * spd * dt, mon.fy / len * spd * dt, mon.r, ghost);
    }

    if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && G.hurtCd <= 0) {
      for (let i = 0; i < G.mons.length; i++) {
        const mon = G.mons[i];
        if (!mon.alive) continue;
        if (hypot(mon.x - p.x, mon.y - p.y) < mon.r + P_R * 0.92) {
          const t = TYPE[mon.kind] || TYPE.grunt;
          hurtPlayer(t.dmg, mon.kind === 'ghost' ? '魂贴上来了' : mon.kind === 'demon' ? '魔撞上了' : '兵撞上了');
          break;
        }
      }
      if (G.hurtCd <= 0) {
        for (let i = 0; i < G.gens.length; i++) {
          const g = G.gens[i];
          if (!g.alive) continue;
          if (hypot(g.x - p.x, g.y - p.y) < G_R * 0.8 + P_R) {
            hurtPlayer(8, '烫到发生器');
            break;
          }
        }
      }
    }
  }

  function shotHitWall(s) {
    audio.wall();
    emit(5, {
      x: s.x, y: s.y, j: 0.04,
      vx0: -3, vx1: 3, vy0: -3, vy1: 3,
      life: 0.14, r0: 0.025, r1: 0.06, rgb: s.rgb, g: 0
    });
  }

  function updateShots(dt) {
    const steps = 3;
    const h = dt / steps;
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (s.dead) {
        G.shots.splice(i, 1);
        continue;
      }
      let live = true;
      for (let k = 0; k < steps && live && !s.dead; k++) {
        s.x += s.vx * h;
        s.y += s.vy * h;
        const t = cellAt(s.x, s.y);
        if (t === WALL) {
          shotHitWall(s);
          live = false;
        } else if (s.from === 'p' && (t === FOOD || t === LOOT || t === POTION)) {
          destroyPickup(s.x | 0, s.y | 0, s);
          live = false;
        } else if (s.from === 'p') {
          for (let g = 0; g < G.gens.length; g++) {
            const gen = G.gens[g];
            if (!gen.alive) continue;
            if (hypot(s.x - gen.x, s.y - gen.y) < G_R + S_R) {
              hitGen(gen, s.dmg);
              if (s.pierce > 0) s.pierce -= 1;
              else live = false;
              break;
            }
          }
          if (!live) break;
          for (let m = 0; m < G.mons.length; m++) {
            const mon = G.mons[m];
            if (!mon.alive) continue;
            if (hypot(s.x - mon.x, s.y - mon.y) < mon.r + S_R) {
              killMon(mon);
              if (s.pierce > 0) s.pierce -= 1;
              else live = false;
              break;
            }
          }
        } else if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
          if (hypot(s.x - G.player.x, s.y - G.player.y) < P_R + S_R) {
            hurtPlayer(s.dmg, '火球打中了');
            live = false;
          }
        }
      }
      if (!live || s.dead || s.x < -0.4 || s.y < -0.4 || s.x > COLS + 0.4 || s.y > ROWS + 0.4) {
        G.shots.splice(i, 1);
      }
    }
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.8);
    G.punch += (1 - G.punch) * Math.min(1, dt * 10);
    G.toastT = Math.max(0, G.toastT - dt);
    if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.t -= dt;
      q.vy += q.g * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= Math.exp(-dt * 1.6);
      if (q.t <= 0) particles.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      const f = pops[i];
      f.t -= dt;
      f.y -= dt * 0.7;
      if (f.t <= 0) pops.splice(i, 1);
    }
    for (let i = lasers.length - 1; i >= 0; i--) {
      lasers[i].t -= dt;
      if (lasers[i].t <= 0) lasers.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.34) rings.splice(i, 1);
    }
  }

  function drainHealth(dt) {
    if (G.mode !== 'play' || G.deadT > 0 || G.ready > 0) return;
    G.hp -= G.drain * dt;
    G.dustT -= dt;
    if (G.dustT <= 0) {
      G.dustT = 0.38;
      emit(2, {
        x: G.player.x, y: G.player.y, j: 0.08,
        vx0: -0.6, vx1: 0.6, vy0: -1.4, vy1: -0.2,
        life: 0.4, r0: 0.02, r1: 0.05, rgb: HOT, g: 0
      });
    }
    if (G.hp < HP_LOW) {
      G.heartT -= dt;
      if (G.heartT <= 0) {
        G.heartT = 0.72;
        audio.heart();
      }
      if (!G.lowWarned) {
        G.lowWarned = true;
        toast('生命将尽', true, false);
      }
    }
    if (G.hp <= 0) {
      G.hp = 0;
      G.deadT = 0.5;
      G.why = '命耗光了';
      toast('命耗光了', true, false);
      audio.hurt();
      kick('die');
      emit(20, {
        x: G.player.x, y: G.player.y, j: 0.16,
        vx0: -7, vx1: 7, vy0: -8, vy1: 4,
        life: 0.42, r0: 0.04, r1: 0.12, rgb: HOT, g: 6
      });
    }
  }

  function demoThink(dt) {
    if (G.t % 2.6 < dt) {
      const face = OCT[(Math.random() * 8) | 0];
      G.player.fx = face[0];
      G.player.fy = face[1];
    }
    tryMove(G.player, G.player.fx * 1.5 * dt, G.player.fy * 1.5 * dt, P_R, false);
    if (liveMons() < 3) {
      for (let i = 0; i < G.gens.length; i++) {
        if (G.gens[i].alive && G.gens[i].kids < 2) {
          G.gens[i].cd = Math.min(G.gens[i].cd, 0.2);
          break;
        }
      }
    }
  }

  function playSim(dt) {
    G.invuln = Math.max(0, G.invuln - dt);
    G.hurtCd = Math.max(0, G.hurtCd - dt);
    if (G.powerT > 0) G.powerT = Math.max(0, G.powerT - dt);
    if (G.ready > 0) G.ready -= dt;
    drainHealth(dt);
    if (G.deadT > 0) return;
    updatePlayer(dt);
    updateGens(dt);
    updateMons(dt);
    updateShots(dt);
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.45);
      return;
    }
    if (G.mode === 'title') {
      demoThink(dt);
      G.mode = 'title';
      updateGens(dt);
      updateMons(dt);
      updateShots(dt);
      updateFx(dt);
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      updateFx(dt);
      return;
    }
    if (G.deadT > 0) {
      G.deadT -= dt;
      updateGens(dt);
      updateMons(dt);
      updateShots(dt);
      if (G.deadT <= 0) loseRun(G.why || '命尽了');
      updateFx(dt);
      syncHud();
      return;
    }
    playSim(dt);
    updateFx(dt);
    syncHud();
  }

  function sx(x) { return ox + x * cell; }
  function sy(y) { return oy + y * cell; }

  function drawGuy(x, y, fx, fy, rgb, walk, ghost, power) {
    const px = sx(x);
    const py = sy(y);
    const s = cell;
    const a = ghost ? 0.42 + 0.38 * Math.sin(G.t * 16) : 1;
    const len = hypot(fx, fy) || 1;
    const ux = fx / len;
    const uy = fy / len;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.shadowColor = rgba(power ? GOLD : rgb, 0.8);
    ctx.shadowBlur = 12 * dpr;
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.beginPath();
    ctx.arc(px, py - s * 0.16, s * 0.13, 0, TAU);
    ctx.fill();
    ctx.fillRect(px - s * 0.07, py - s * 0.04, s * 0.14, s * 0.2);
    const swing = Math.sin(walk) * s * 0.07;
    ctx.fillRect(px - s * 0.1, py + s * 0.14, s * 0.07, s * 0.16 + swing);
    ctx.fillRect(px + s * 0.03, py + s * 0.14, s * 0.07, s * 0.16 - swing);
    ctx.strokeStyle = rgba(power ? GOLD : WHT, 0.95);
    ctx.lineWidth = Math.max(2, s * 0.055);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(px + ux * s * 0.06, py + uy * s * 0.02);
    ctx.lineTo(px + ux * s * 0.3, py + uy * s * 0.3);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawGrunt(m) {
    const px = sx(m.x);
    const py = sy(m.y);
    const s = cell;
    const bob = Math.sin(m.walk) * s * 0.03;
    ctx.save();
    ctx.shadowColor = rgba(m.rgb, 0.7);
    ctx.shadowBlur = 10 * dpr;
    ctx.fillStyle = rgba(m.rgb, 0.95);
    ctx.beginPath();
    ctx.arc(px, py - s * 0.08 + bob, s * 0.16, 0, TAU);
    ctx.fill();
    ctx.fillRect(px - s * 0.14, py - s * 0.02 + bob, s * 0.28, s * 0.22);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#05030c';
    ctx.fillRect(px - s * 0.08, py - s * 0.12 + bob, s * 0.05, s * 0.06);
    ctx.fillRect(px + s * 0.03, py - s * 0.12 + bob, s * 0.05, s * 0.06);
    ctx.restore();
  }

  function drawGhost(m) {
    const px = sx(m.x);
    const py = sy(m.y);
    const s = cell;
    const w = 0.82 + 0.18 * Math.sin(G.t * 6 + m.x);
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.25 * Math.sin(G.t * 5 + m.y);
    ctx.shadowColor = rgba(MAG, 0.85);
    ctx.shadowBlur = 14 * dpr;
    ctx.fillStyle = rgba(MAG, 0.9);
    ctx.beginPath();
    ctx.moveTo(px, py - s * 0.22);
    ctx.quadraticCurveTo(px + s * 0.2, py - s * 0.02, px + s * 0.16, py + s * 0.2);
    ctx.lineTo(px + s * 0.06, py + s * 0.1);
    ctx.lineTo(px, py + s * 0.22);
    ctx.lineTo(px - s * 0.06, py + s * 0.1);
    ctx.quadraticCurveTo(px - s * 0.2, py - s * 0.02, px, py - s * 0.22);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = '#05030c';
    ctx.beginPath();
    ctx.arc(px - s * 0.05, py - s * 0.04, s * 0.035 * w, 0, TAU);
    ctx.arc(px + s * 0.05, py - s * 0.04, s * 0.035 * w, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawDemon(m) {
    const px = sx(m.x);
    const py = sy(m.y);
    const s = cell;
    ctx.save();
    ctx.shadowColor = rgba(m.rgb, 0.8);
    ctx.shadowBlur = 12 * dpr;
    ctx.fillStyle = rgba(m.rgb, 0.95);
    ctx.beginPath();
    ctx.moveTo(px, py + s * 0.18);
    ctx.lineTo(px + s * 0.18, py - s * 0.02);
    ctx.lineTo(px + s * 0.12, py - s * 0.22);
    ctx.lineTo(px, py - s * 0.1);
    ctx.lineTo(px - s * 0.12, py - s * 0.22);
    ctx.lineTo(px - s * 0.18, py - s * 0.02);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(px, py + s * 0.02, s * 0.05, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawGen(g) {
    const px = sx(g.x);
    const py = sy(g.y);
    const s = cell;
    const pulse = 0.82 + 0.18 * Math.sin(g.pulse);
    const hpK = g.hp / g.maxHp;
    ctx.save();
    ctx.shadowColor = rgba(g.rgb, 0.75);
    ctx.shadowBlur = 14 * dpr * pulse;
    ctx.fillStyle = '#2a140c';
    ctx.fillRect(px - s * 0.18, py + s * 0.08, s * 0.36, s * 0.14);
    ctx.beginPath();
    ctx.moveTo(px, py - s * 0.28 * pulse);
    ctx.lineTo(px + s * 0.18, py);
    ctx.lineTo(px, py + s * 0.16);
    ctx.lineTo(px - s * 0.18, py);
    ctx.closePath();
    ctx.fillStyle = rgba(g.rgb, 0.55 + 0.35 * pulse);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.35 * pulse);
    ctx.beginPath();
    ctx.moveTo(px, py - s * 0.16 * pulse);
    ctx.lineTo(px + s * 0.08, py);
    ctx.lineTo(px, py + s * 0.06);
    ctx.lineTo(px - s * 0.08, py);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    if (hpK < 0.72) {
      ctx.strokeStyle = rgba(WHT, 0.45);
      ctx.lineWidth = Math.max(1, s * 0.03);
      ctx.beginPath();
      ctx.moveTo(px - s * 0.08, py - s * 0.04);
      ctx.lineTo(px + s * 0.06, py + s * 0.06);
      if (hpK < 0.4) {
        ctx.moveTo(px + s * 0.1, py - s * 0.08);
        ctx.lineTo(px - s * 0.02, py + s * 0.1);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShot(s) {
    const x1 = sx(s.x);
    const y1 = sy(s.y);
    const x0 = sx(s.x - s.vx * 0.04);
    const y0 = sy(s.y - s.vy * 0.04);
    ctx.lineCap = 'round';
    ctx.strokeStyle = rgba(s.rgb, 0.28);
    ctx.lineWidth = cell * (s.power ? 0.26 : 0.2);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.strokeStyle = rgba(s.rgb, 0.9);
    ctx.lineWidth = cell * (s.power ? 0.12 : 0.09);
    ctx.stroke();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = cell * 0.04;
    ctx.stroke();
  }

  function drawPickup(c, r, t) {
    const px = sx(c + 0.5);
    const py = sy(r + 0.5);
    const s = cell;
    const bob = Math.sin(G.t * 5 + c * 1.7 + r) * s * 0.05;
    ctx.save();
    if (t === FOOD) {
      ctx.shadowColor = rgba(GRN, 0.7);
      ctx.shadowBlur = 10 * dpr;
      ctx.fillStyle = rgba(GRN, 0.95);
      ctx.beginPath();
      ctx.arc(px, py + bob, s * 0.16, 0, TAU);
      ctx.fill();
      ctx.fillStyle = GOLD;
      ctx.fillRect(px - s * 0.03, py - s * 0.2 + bob, s * 0.06, s * 0.1);
    } else if (t === LOOT) {
      ctx.shadowColor = rgba(GOLD, 0.8);
      ctx.shadowBlur = 12 * dpr;
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.fillRect(px - s * 0.16, py - s * 0.08 + bob, s * 0.32, s * 0.2);
      ctx.fillStyle = HOT2;
      ctx.fillRect(px - s * 0.16, py - s * 0.02 + bob, s * 0.32, s * 0.05);
      ctx.fillStyle = WHT;
      ctx.fillRect(px - s * 0.03, py - s * 0.02 + bob, s * 0.06, s * 0.08);
    } else if (t === POTION) {
      ctx.shadowColor = rgba(PUR, 0.85);
      ctx.shadowBlur = 12 * dpr;
      ctx.fillStyle = rgba(PUR, 0.92);
      ctx.beginPath();
      ctx.moveTo(px - s * 0.1, py - s * 0.04 + bob);
      ctx.lineTo(px + s * 0.1, py - s * 0.04 + bob);
      ctx.lineTo(px + s * 0.08, py + s * 0.16 + bob);
      ctx.lineTo(px - s * 0.08, py + s * 0.16 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.fillRect(px - s * 0.05, py - s * 0.16 + bob, s * 0.1, s * 0.08);
    }
    ctx.restore();
  }

  function drawExit(c, r) {
    const px = sx(c + 0.5);
    const py = sy(r + 0.5);
    const pulse = 0.55 + 0.45 * Math.sin(G.t * 4.6);
    ctx.save();
    ctx.shadowColor = rgba(G.cleared ? GOLD : CYN, 0.85);
    ctx.shadowBlur = 16 * dpr;
    ctx.strokeStyle = rgba(G.cleared ? GOLD : CYN, 0.35 + pulse * 0.4);
    ctx.lineWidth = Math.max(2, cell * 0.06);
    ctx.beginPath();
    ctx.arc(px, py, cell * 0.28, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px, py, cell * (0.12 + pulse * 0.08), 0, TAU);
    ctx.fillStyle = rgba(G.cleared ? GOLD : CYN, 0.5 + pulse * 0.3);
    ctx.fill();
    ctx.restore();
  }

  function drawMaze() {
    const cw = COLS * cell;
    const ch = ROWS * cell;
    ctx.fillStyle = '#14080a';
    ctx.fillRect(ox, oy, cw, ch);

    ctx.fillStyle = '#080406';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (G.grid[idx(c, r)] === WALL) continue;
        ctx.fillRect(ox + c * cell, oy + r * cell, cell + 0.5, cell + 0.5);
      }
    }

    ctx.strokeStyle = 'rgba(255,90,31,0.07)';
    ctx.lineWidth = 1;
    for (let r = 1; r < ROWS; r++) {
      for (let c = 1; c < COLS; c++) {
        if (G.grid[idx(c, r)] === WALL) continue;
        ctx.beginPath();
        ctx.moveTo(ox + c * cell, oy + r * cell);
        ctx.lineTo(ox + c * cell, oy + r * cell + cell);
        ctx.moveTo(ox + c * cell, oy + r * cell);
        ctx.lineTo(ox + c * cell + cell, oy + r * cell);
        ctx.stroke();
      }
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = G.grid[idx(c, r)];
        if (t === EXIT) drawExit(c, r);
        else if (t === FOOD || t === LOOT || t === POTION) drawPickup(c, r, t);
      }
    }

    const inset = Math.max(1, cell * 0.07);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (G.grid[idx(c, r)] !== WALL) continue;
        const x = ox + c * cell;
        const y = oy + r * cell;
        ctx.fillStyle = '#1a0a08';
        ctx.fillRect(x - 0.5, y - 0.5, cell + 1, cell + 1);
      }
    }

    ctx.beginPath();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (G.grid[idx(c, r)] !== WALL) continue;
        const x = ox + c * cell;
        const y = oy + r * cell;
        if (!inb(c, r - 1) || G.grid[idx(c, r - 1)] !== WALL) {
          ctx.moveTo(x + inset, y + inset);
          ctx.lineTo(x + cell - inset, y + inset);
        }
        if (!inb(c, r + 1) || G.grid[idx(c, r + 1)] !== WALL) {
          ctx.moveTo(x + inset, y + cell - inset);
          ctx.lineTo(x + cell - inset, y + cell - inset);
        }
        if (!inb(c - 1, r) || G.grid[idx(c - 1, r)] !== WALL) {
          ctx.moveTo(x + inset, y + inset);
          ctx.lineTo(x + inset, y + cell - inset);
        }
        if (!inb(c + 1, r) || G.grid[idx(c + 1, r)] !== WALL) {
          ctx.moveTo(x + cell - inset, y + inset);
          ctx.lineTo(x + cell - inset, y + cell - inset);
        }
      }
    }
    ctx.lineCap = 'square';
    ctx.strokeStyle = rgba(HOT, 0.55);
    ctx.lineWidth = Math.max(3.2, cell * 0.16);
    ctx.stroke();
    ctx.strokeStyle = rgba(HOT, 0.95);
    ctx.lineWidth = Math.max(1.6, cell * 0.08);
    ctx.stroke();
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#03010a';
    ctx.fillRect(0, 0, W, H);

    let shx = 0;
    let shy = 0;
    if (G.shake > 0 && !REDUCE) {
      shx = rand(-G.shake, G.shake) * dpr * 0.35;
      shy = rand(-G.shake, G.shake) * dpr * 0.35;
    }
    ctx.save();
    ctx.translate(shx, shy);
    const punch = REDUCE ? 1 : G.punch;
    if (punch !== 1) {
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(punch, punch);
      ctx.translate(-W * 0.5, -H * 0.5);
    }

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      ctx.fillStyle = rgba(HOT, m.a);
      ctx.beginPath();
      ctx.arc(m.x * W, ((m.y + G.t * 0.02 + m.p) % 1) * H, m.r, 0, TAU);
      ctx.fill();
    }

    drawMaze();

    for (let i = 0; i < rings.length; i++) {
      const rg = rings[i];
      const k = rg.t / 0.34;
      ctx.strokeStyle = rgba(rg.rgb, 0.7 * (1 - k));
      ctx.lineWidth = Math.max(1.5, cell * 0.06 * (1 - k));
      ctx.beginPath();
      ctx.arc(sx(rg.x), sy(rg.y), cell * (0.2 + k * 0.7), 0, TAU);
      ctx.stroke();
    }

    for (let i = 0; i < lasers.length; i++) {
      const L = lasers[i];
      const a = L.t / 0.08;
      const x0 = sx(L.x);
      const y0 = sy(L.y);
      const x1 = sx(L.x + L.ux * 1.35);
      const y1 = sy(L.y + L.uy * 1.35);
      ctx.lineCap = 'round';
      ctx.strokeStyle = rgba(L.rgb, 0.55 * a);
      ctx.lineWidth = cell * 0.26;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.strokeStyle = rgba(WHT, 0.9 * a);
      ctx.lineWidth = cell * 0.07;
      ctx.stroke();
    }

    for (let i = 0; i < G.gens.length; i++) {
      if (G.gens[i].alive) drawGen(G.gens[i]);
    }

    for (let i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);

    for (let i = 0; i < G.mons.length; i++) {
      const m = G.mons[i];
      if (!m.alive) continue;
      if (m.kind === 'ghost') drawGhost(m);
      else if (m.kind === 'demon') drawDemon(m);
      else drawGrunt(m);
    }

    if (G.deadT <= 0) {
      const ghost = G.invuln > 0 && (G.invuln * 12 | 0) % 2 === 0;
      drawGuy(G.player.x, G.player.y, G.player.fx, G.player.fy, CYN, G.player.walk, ghost, G.powerT > 0);
    }

    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = q.t / q.life;
      ctx.fillStyle = rgba(q.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), Math.max(1, q.r * cell * (0.6 + a)), 0, TAU);
      ctx.fill();
    }

    ctx.font = '700 ' + Math.max(11, cell * 0.38) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < pops.length; i++) {
      const f = pops[i];
      const a = f.t / f.life;
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }

    if (G.flash > 0 && !REDUCE) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.22);
      ctx.fillRect(ox, oy, COLS * cell, ROWS * cell);
    }

    ctx.restore();
  }

  function overlayBlocksPlay() {
    return overlayOpen() && G.mode !== 'play';
  }

  function onPointerDown(e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    if (overlayBlocksPlay()) return;
    e.preventDefault();
    const w = worldFromPtr(e.clientX, e.clientY);
    ptr.down = true;
    ptr.id = e.pointerId;
    ptr.sx = w.x;
    ptr.sy = w.y;
    ptr.x = w.x;
    ptr.y = w.y;
    ptr.dragging = false;
    ptr.dx = 0;
    ptr.dy = 0;
    if (canvas.setPointerCapture) {
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
  }

  function onPointerMove(e) {
    if (!ptr.down || (ptr.id != null && e.pointerId !== ptr.id)) return;
    const w = worldFromPtr(e.clientX, e.clientY);
    ptr.x = w.x;
    ptr.y = w.y;
    const dx = w.x - ptr.sx;
    const dy = w.y - ptr.sy;
    if (hypot(dx, dy) > 0.35) {
      ptr.dragging = true;
      const s = snap8(dx, dy);
      ptr.dx = s[0];
      ptr.dy = s[1];
    }
  }

  function onPointerUp(e) {
    if (ptr.id != null && e.pointerId !== ptr.id) return;
    if (ptr.down && !ptr.dragging && !overlayBlocksPlay()) {
      const dx = ptr.x - G.player.x;
      const dy = ptr.y - G.player.y;
      if (hypot(dx, dy) > 0.05) firePlayer(dx, dy);
      else firePlayer(G.player.fx, G.player.fy);
    }
    ptr.down = false;
    ptr.dragging = false;
    ptr.dx = 0;
    ptr.dy = 0;
    ptr.id = null;
  }

  function setKey(dir, down) {
    if (dir === 'up') keys.u = down;
    if (dir === 'down') keys.d = down;
    if (dir === 'left') keys.l = down;
    if (dir === 'right') keys.r = down;
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startCampaign();
      return;
    }
    if (G.mode === 'win' || G.mode === 'lose') restart();
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isUp = k === 'ArrowUp' || k === 'w' || k === 'W' || code === 'KeyW';
    const isDn = k === 'ArrowDown' || k === 's' || k === 'S' || code === 'KeyS';
    const isLf = k === 'ArrowLeft' || k === 'a' || k === 'A' || code === 'KeyA';
    const isRt = k === 'ArrowRight' || k === 'd' || k === 'D' || code === 'KeyD';
    const isSp = k === ' ' || k === 'Spacebar' || code === 'Space';
    if (isUp || isDn || isLf || isRt || isSp) e.preventDefault();
    if (isUp) setKey('up', down);
    if (isDn) setKey('down', down);
    if (isLf) setKey('left', down);
    if (isRt) setKey('right', down);
    if (isSp) fireHold = down;
    if (!down) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (e.repeat) return;
    if (isSp || k === 'Enter') {
      if (e.target && e.target.tagName === 'BUTTON') return;
      audio.ensure();
      if (overlayOpen()) {
        primaryAction();
        return;
      }
    }
  }

  function bindPad(btn, dir) {
    if (!btn) return;
    const start = function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      if (dir === 'fire') {
        if (!overlayBlocksPlay()) firePlayer(G.player.fx, G.player.fy);
        fireHold = true;
        btn.classList.add('held');
        return;
      }
      setKey(dir, true);
      btn.classList.add('held');
    };
    const end = function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (dir === 'fire') {
        fireHold = false;
        btn.classList.remove('held');
        return;
      }
      setKey(dir, false);
      btn.classList.remove('held');
    };
    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', end);
    btn.addEventListener('pointerleave', end);
    btn.addEventListener('pointercancel', end);
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 26; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: rand(0.5, 1.6) * dpr,
        a: rand(0.03, 0.1),
        p: rand(0, 1)
      });
    }
  }

  function resize() {
    if (!canvas || !stageEl) return;
    const rect = stageEl.getBoundingClientRect();
    dpr = Math.min(2.25, window.devicePixelRatio || 1);
    W = Math.max(1, Math.floor(rect.width * dpr));
    H = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width = W;
    canvas.height = H;
    const pad = 10 * dpr;
    cell = Math.max(12, Math.min((W - pad * 2) / COLS, (H - pad * 2) / ROWS));
    ox = (W - COLS * cell) * 0.5;
    oy = (H - ROWS * cell) * 0.5;
    seedMotes();
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.u = keys.d = keys.l = keys.r = false;
    fireHold = false;
    ptr.down = false;
    ptr.dragging = false;
    ptr.dx = ptr.dy = 0;
  });

  if (btnCampaign) btnCampaign.addEventListener('click', function () { audio.ensure(); startCampaign(); });
  if (btnEndless) btnEndless.addEventListener('click', function () { audio.ensure(); startEndless(); });
  if (ovAgain) ovAgain.addEventListener('click', function () { primaryAction(); });
  if (ovMenu) ovMenu.addEventListener('click', function () { audio.ensure(); bootTitle(); });
  if (btnRetry) btnRetry.addEventListener('click', function () { restart(); });
  if (btnMute) btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  if (modeCamp) modeCamp.addEventListener('click', function () {
    audio.ensure();
    startCampaign();
  });
  if (modeEnd) modeEnd.addEventListener('click', function () {
    audio.ensure();
    startEndless();
  });

  bindPad(padBtns.up, 'up');
  bindPad(padBtns.down, 'down');
  bindPad(padBtns.left, 'left');
  bindPad(padBtns.right, 'right');
  bindPad(padBtns.fire, 'fire');

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
  } catch (err) { /* ignore */ }

  loadBest();
  resize();
  bootTitle();
  syncHud();

  if (padEl && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
    setHint('滑动走 · 点按或射开火 · 出口进下层');
  }

  let last = performance.now();
  let acc = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (hidden) {
      last = now;
      return;
    }
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      update(STEP);
      acc -= STEP;
      steps += 1;
    }
    if (acc > STEP * 5) acc = 0;
    draw();
  }
  requestAnimationFrame(frame);
})();
