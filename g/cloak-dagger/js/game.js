'use strict';

(function () {
  const COLS = 21;
  const ROWS = 13;
  const EMPTY = 0;
  const WALL = 1;
  const EXIT = 2;
  const ONE_N = 3;
  const ONE_E = 4;
  const ONE_S = 5;
  const ONE_W = 6;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const P_SPD = 4.42;
  const P_R = 0.28;
  const G_R = 0.32;
  const D_SPD = 16.8;
  const COMBO_WIN = 1.55;
  const EXIT_R = 6;
  const SPAWN_C = 1;
  const SPAWN_R = 6;
  const BEST_KEY = 'playbox-cloak-dagger-best';
  const MUTE_KEY = 'playbox-cloak-dagger-mute';
  const DX = [0, 1, 0, -1];
  const DY = [-1, 0, 1, 0];
  const OPS = 'WASD / 方向键走 · 空格丢匕 · 箱够了走出口 · R 重开 · M 静音';

  const MAG = [177, 77, 255];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 58, 122];
  const WHT = [246, 238, 255];
  const ORG = [255, 140, 70];
  const PUR = [122, 70, 210];

  const INFIL = [
    { name: '门廊', kits: 2, guards: 2, bombs: 1, gates: 1, vis: 6.1, gSpd: 1.52, chase: 2.38 },
    { name: '档案', kits: 3, guards: 3, bombs: 2, gates: 2, vis: 6.4, gSpd: 1.62, chase: 2.52 },
    { name: '库房', kits: 3, guards: 4, bombs: 2, gates: 2, vis: 6.7, gSpd: 1.72, chase: 2.64 },
    { name: '暗巷', kits: 4, guards: 4, bombs: 3, gates: 3, vis: 7.0, gSpd: 1.82, chase: 2.78 },
    { name: '机房', kits: 4, guards: 5, bombs: 3, gates: 3, vis: 7.2, gSpd: 1.92, chase: 2.9 },
    { name: '金库', kits: 5, guards: 5, bombs: 4, gates: 3, vis: 7.4, gSpd: 2.02, chase: 3.02 },
    { name: '楼顶', kits: 5, guards: 6, bombs: 4, gates: 4, vis: 7.6, gSpd: 2.12, chase: 3.14 },
    { name: '撤离', kits: 6, guards: 6, bombs: 5, gates: 4, vis: 8.0, gSpd: 2.22, chase: 3.28 }
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
  function snap4(dx, dy) {
    if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 1 : 3;
    return dy >= 0 ? 2 : 0;
  }
  function multOf(combo) {
    return 1 + Math.min(4, combo >> 1);
  }
  function isOne(t) {
    return t >= ONE_N && t <= ONE_W;
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

  function oneBlocksVel(t, vx, vy) {
    if (!isOne(t)) return false;
    if (t === ONE_N && vy > 0.02) return true;
    if (t === ONE_S && vy < -0.02) return true;
    if (t === ONE_E && vx < -0.02) return true;
    if (t === ONE_W && vx > 0.02) return true;
    return false;
  }

  function canStep(grid, fc, fr, tc, tr) {
    if (!inb(tc, tr)) return false;
    const t = grid[idx(tc, tr)];
    if (t === WALL) return false;
    const dc = tc - fc;
    const dr = tr - fr;
    if (isOne(t)) {
      if (t === ONE_N && dr !== -1) return false;
      if (t === ONE_S && dr !== 1) return false;
      if (t === ONE_E && dc !== 1) return false;
      if (t === ONE_W && dc !== -1) return false;
    }
    const ft = grid[idx(fc, fr)];
    if (isOne(ft)) {
      if (ft === ONE_N && dr !== -1) return false;
      if (ft === ONE_S && dr !== 1) return false;
      if (ft === ONE_E && dc !== 1) return false;
      if (ft === ONE_W && dc !== -1) return false;
    }
    return true;
  }

  function floodPlain(grid, sc, sr) {
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

  function floodOne(grid, sc, sr) {
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
        if (!canStep(grid, c, r, nc, nr)) continue;
        seen[idx(nc, nr)] = 1;
        q.push(nc, nr);
      }
    }
    return seen;
  }

  function carveLine(grid, c0, r0, c1, r1) {
    let c = c0;
    let r = r0;
    let guard = 90;
    while ((c !== c1 || r !== r1) && guard-- > 0) {
      if (c !== c1) c += c1 > c ? 1 : -1;
      else r += r1 > r ? 1 : -1;
      if (c > 0 && r > 0 && c < COLS - 1 && r < ROWS - 1) {
        if (grid[idx(c, r)] === WALL) grid[idx(c, r)] = EMPTY;
      }
    }
  }

  function carveRect(grid, c, r, w, h) {
    for (let y = r; y < r + h; y++) {
      for (let x = c; x < c + w; x++) {
        if (x > 0 && y > 0 && x < COLS - 1 && y < ROWS - 1) grid[idx(x, y)] = EMPTY;
      }
    }
  }

  function punchExit(grid) {
    grid[idx(COLS - 1, EXIT_R - 1)] = EXIT;
    grid[idx(COLS - 1, EXIT_R)] = EXIT;
    grid[idx(COLS - 1, EXIT_R + 1)] = EXIT;
    grid[idx(COLS - 2, EXIT_R - 1)] = EMPTY;
    grid[idx(COLS - 2, EXIT_R)] = EMPTY;
    grid[idx(COLS - 2, EXIT_R + 1)] = EMPTY;
  }

  function genMaze(seed) {
    const grid = new Uint8Array(COLS * ROWS);
    grid.fill(WALL);
    const rng = rngSeed(seed);
    const rooms = [];

    function addRoom(c, r, w, h) {
      c = clamp(c | 0, 1, COLS - 2);
      r = clamp(r | 0, 1, ROWS - 2);
      w = Math.min(w | 0, COLS - 1 - c);
      h = Math.min(h | 0, ROWS - 1 - r);
      if (w < 2 || h < 2) return;
      rooms.push({ c: c, r: r, w: w, h: h });
      carveRect(grid, c, r, w, h);
    }

    addRoom(1, 4, 4, 5);
    addRoom(COLS - 5, 4, 4, 5);
    const extra = 4 + (rng() * 3 | 0);
    for (let i = 0; i < extra; i++) {
      const w = 3 + (rng() * 3 | 0);
      const h = 3 + (rng() * 3 | 0);
      const c = 3 + (rng() * (COLS - w - 5) | 0);
      const r = 1 + (rng() * (ROWS - h - 2) | 0);
      addRoom(c, r, w, h);
    }

    for (let i = 1; i < rooms.length; i++) {
      const a = rooms[i - 1];
      const b = rooms[i];
      const ac = a.c + (a.w >> 1);
      const ar = a.r + (a.h >> 1);
      const bc = b.c + (b.w >> 1);
      const br = b.r + (b.h >> 1);
      if (rng() < 0.5) {
        carveLine(grid, ac, ar, bc, ar);
        carveLine(grid, bc, ar, bc, br);
      } else {
        carveLine(grid, ac, ar, ac, br);
        carveLine(grid, ac, br, bc, br);
      }
    }

    for (let i = 0; i < 3; i++) {
      const a = rooms[(rng() * rooms.length) | 0];
      const b = rooms[(rng() * rooms.length) | 0];
      carveLine(
        grid,
        a.c + (a.w >> 1), a.r + (a.h >> 1),
        b.c + (b.w >> 1), b.r + (b.h >> 1)
      );
    }

    for (let i = 0; i < rooms.length; i++) {
      const rm = rooms[i];
      if (rm.w >= 4 && rm.h >= 4 && rng() < 0.5) {
        const pc = rm.c + 1 + (rng() * Math.max(1, rm.w - 2) | 0);
        const pr = rm.r + 1 + (rng() * Math.max(1, rm.h - 2) | 0);
        if (pc > 1 && pr > 1 && pc < COLS - 2 && pr < ROWS - 2) {
          if (Math.abs(pc - SPAWN_C) + Math.abs(pr - SPAWN_R) > 3) grid[idx(pc, pr)] = WALL;
        }
      }
    }

    punchExit(grid);
    grid[idx(SPAWN_C, SPAWN_R)] = EMPTY;
    grid[idx(SPAWN_C + 1, SPAWN_R)] = EMPTY;
    grid[idx(SPAWN_C, SPAWN_R - 1)] = EMPTY;
    grid[idx(SPAWN_C, SPAWN_R + 1)] = EMPTY;

    let seen = floodPlain(grid, SPAWN_C, SPAWN_R);
    if (!seen[idx(COLS - 2, EXIT_R)]) {
      carveLine(grid, SPAWN_C, SPAWN_R, COLS - 2, EXIT_R);
      seen = floodPlain(grid, SPAWN_C, SPAWN_R);
    }
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (grid[idx(c, r)] === WALL) continue;
        if (!seen[idx(c, r)]) {
          carveLine(grid, SPAWN_C, SPAWN_R, c, r);
          seen = floodPlain(grid, SPAWN_C, SPAWN_R);
        }
      }
    }
    punchExit(grid);
    return grid;
  }

  function placeOneWays(grid, n, rng) {
    const cands = [];
    for (let r = 2; r < ROWS - 2; r++) {
      for (let c = 4; c < COLS - 4; c++) {
        if (grid[idx(c, r)] !== EMPTY) continue;
        if (Math.abs(c - SPAWN_C) + Math.abs(r - SPAWN_R) < 4) continue;
        if (c >= COLS - 3 && Math.abs(r - EXIT_R) <= 1) continue;
        const nN = grid[idx(c, r - 1)] !== WALL;
        const nS = grid[idx(c, r + 1)] !== WALL;
        const nE = grid[idx(c + 1, r)] !== WALL;
        const nW = grid[idx(c - 1, r)] !== WALL;
        const count = (nN ? 1 : 0) + (nS ? 1 : 0) + (nE ? 1 : 0) + (nW ? 1 : 0);
        if (count !== 2) continue;
        if (nN && nS && !nE && !nW) cands.push({ c: c, r: r, t: rng() < 0.5 ? ONE_N : ONE_S });
        else if (nE && nW && !nN && !nS) cands.push({ c: c, r: r, t: rng() < 0.5 ? ONE_E : ONE_W });
      }
    }
    for (let i = cands.length - 1; i > 0; i--) {
      const j = (rng() * (i + 1)) | 0;
      const tmp = cands[i];
      cands[i] = cands[j];
      cands[j] = tmp;
    }
    let placed = 0;
    for (let i = 0; i < cands.length && placed < n; i++) {
      const p = cands[i];
      const old = grid[idx(p.c, p.r)];
      grid[idx(p.c, p.r)] = p.t;
      const seen = floodOne(grid, SPAWN_C, SPAWN_R);
      if (!seen[idx(COLS - 2, EXIT_R)] || !seen[idx(COLS - 1, EXIT_R)]) {
        grid[idx(p.c, p.r)] = old;
        continue;
      }
      placed += 1;
    }
    return placed;
  }

  function mazeOk(grid) {
    if (grid[idx(SPAWN_C, SPAWN_R)] === WALL) return false;
    if (grid[idx(COLS - 1, EXIT_R)] !== EXIT) return false;
    if (grid[idx(COLS - 1, EXIT_R - 1)] !== EXIT) return false;
    const seen = floodOne(grid, SPAWN_C, SPAWN_R);
    if (!seen[idx(COLS - 2, EXIT_R)]) return false;
    if (!seen[idx(COLS - 1, EXIT_R)]) return false;
    let n = 0;
    for (let i = 0; i < seen.length; i++) if (seen[i]) n += 1;
    return n >= 22;
  }

  function makeGrid(seed, gates) {
    let grid = genMaze(seed);
    const rng = rngSeed(seed + 901);
    placeOneWays(grid, gates, rng);
    for (let a = 1; a < 10 && !mazeOk(grid); a++) {
      grid = genMaze(seed + a * 97);
      placeOneWays(grid, gates, rngSeed(seed + 901 + a * 13));
    }
    return grid;
  }

  function circleRect(cx, cy, rad, rx, ry, rw, rh) {
    const nx = clamp(cx, rx, rx + rw);
    const ny = clamp(cy, ry, ry + rh);
    const dx = cx - nx;
    const dy = cy - ny;
    return dx * dx + dy * dy < rad * rad;
  }

  function cellAt(x, y) {
    const c = x | 0;
    const r = y | 0;
    if (!inb(c, r)) return WALL;
    return G.grid[idx(c, r)];
  }

  function blocked(x, y, rad, vx, vy) {
    const c0 = Math.max(0, (x - rad) | 0);
    const r0 = Math.max(0, (y - rad) | 0);
    const c1 = Math.min(COLS - 1, (x + rad) | 0);
    const r1 = Math.min(ROWS - 1, (y + rad) | 0);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const t = G.grid[idx(c, r)];
        if (t === WALL || oneBlocksVel(t, vx, vy)) {
          if (circleRect(x, y, rad, c, r, 1, 1)) return true;
        }
      }
    }
    return false;
  }

  function tryMove(ent, dx, dy, rad) {
    const nx = ent.x + dx;
    const ny = ent.y + dy;
    if (dx !== 0 && !blocked(nx, ent.y, rad, dx, 0)) ent.x = nx;
    if (dy !== 0 && !blocked(ent.x, ny, rad, 0, dy)) ent.y = ny;
    ent.x = clamp(ent.x, rad + 0.02, COLS - rad - 0.02);
    ent.y = clamp(ent.y, rad + 0.02, ROWS - rad - 0.02);
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

  function selfCheck() {
    if (snap4(3, 0.2) !== 1) throw new Error('snap4 e');
    if (snap4(-2, 0.1) !== 3) throw new Error('snap4 w');
    if (snap4(0.1, 4) !== 2) throw new Error('snap4 s');
    if (snap4(0, -2) !== 0) throw new Error('snap4 n');
    if (multOf(0) !== 1 || multOf(2) !== 2 || multOf(9) !== 5) throw new Error('combo');
    if (!oneBlocksVel(ONE_E, -1, 0) || oneBlocksVel(ONE_E, 1, 0)) throw new Error('one-way e');
    const tg = new Uint8Array(COLS * ROWS);
    tg[idx(5, 5)] = ONE_E;
    tg[idx(4, 5)] = EMPTY;
    tg[idx(6, 5)] = EMPTY;
    if (!canStep(tg, 4, 5, 5, 5)) throw new Error('enter one-e');
    if (canStep(tg, 6, 5, 5, 5)) throw new Error('enter one-e reverse');
    if (!canStep(tg, 5, 5, 6, 5)) throw new Error('leave one-e');
    if (canStep(tg, 5, 5, 4, 5)) throw new Error('leave one-e reverse');
    for (let i = 0; i < 24; i++) {
      const g = makeGrid(13 * i + 7, 1 + (i % 4));
      if (!mazeOk(g)) throw new Error('maze ' + i);
    }
    return true;
  }

  if (!hasDom) {
    selfCheck();
    return;
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
    throw() {
      this.ensure();
      this.beep(880, 0.05, 'square', 0.045, 420);
      this.beep(1320, 0.04, 'sawtooth', 0.028, 640);
    },
    stick() {
      this.ensure();
      this.noise(0.045, 0.032, 1100);
      this.beep(310, 0.05, 'triangle', 0.03, 140);
    },
    grab() {
      this.ensure();
      this.beep(660, 0.05, 'sine', 0.035, 990);
    },
    kit() {
      this.ensure();
      this.beep(523, 0.07, 'sine', 0.045, 784);
      this.beep(784, 0.1, 'triangle', 0.04, 1174);
    },
    alert() {
      this.ensure();
      this.beep(880, 0.09, 'square', 0.055, 1320);
      this.beep(1320, 0.16, 'square', 0.05, 990);
      this.beep(440, 0.2, 'sawtooth', 0.03, 220);
    },
    boom() {
      this.ensure();
      this.noise(0.14, 0.07, 240);
      this.beep(180, 0.16, 'sawtooth', 0.055, 55);
    },
    hit() {
      this.ensure();
      this.beep(240, 0.08, 'sawtooth', 0.05, 90);
      this.noise(0.07, 0.04, 500);
    },
    combo(n) {
      this.ensure();
      const f = 520 + Math.min(8, n) * 70;
      this.beep(f, 0.07, 'square', 0.04, f * 1.5);
    },
    hurt() {
      this.ensure();
      this.beep(180, 0.16, 'sawtooth', 0.055, 70);
      this.noise(0.12, 0.05, 400);
    },
    door() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 660);
      this.beep(784, 0.12, 'triangle', 0.035);
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
  const stageLabel = el('stage-label');
  const tagLabel = el('tag-label');
  const pipsEl = el('pips');
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

  const keys = { u: false, d: false, l: false, r: false };
  const ptr = { down: false, dragging: false, id: null, sx: 0, sy: 0, x: 0, y: 0, dx: 0, dy: 0 };
  let fireHold = false;
  let fireLatch = false;
  let hidden = false;
  let dpr = 1;
  let W = 1;
  let H = 1;
  let cell = 24;
  let ox = 0;
  let oy = 0;
  let addTok = 0;
  let chainTok = 0;
  let toastTok = 0;
  const particles = [];
  const pops = [];
  const rings = [];
  const motes = [];
  const trails = [];
  const pips = [];

  const G = {
    mode: 'title',
    kind: 'campaign',
    stage: 0,
    wave: 1,
    roomId: 1,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    t: 0,
    clock: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    toastT: 0,
    ready: 0,
    invuln: 0,
    cloak: 0,
    deadT: 0,
    throwCd: 0,
    pickLock: 0,
    exitNag: 0,
    opened: false,
    why: '',
    grid: new Uint8Array(COLS * ROWS),
    player: { x: 1.5, y: SPAWN_R + 0.5, fx: 1, fy: 0, dir: 1, walk: 0 },
    dagger: { state: 'hand', x: 0, y: 0, vx: 0, vy: 0, ang: 0, dir: 1 },
    guards: [],
    kits: [],
    bombs: [],
    kitNeed: 0,
    kitGot: 0,
    vis: 6,
    gSpd: 1.6,
    chase: 2.5
  };

  function loadBest() {
    try {
      const v = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
      G.best = isFinite(v) && v > 0 ? v : 0;
    } catch (err) {
      G.best = 0;
    }
  }

  function saveBest() {
    if (G.score > G.best) G.best = G.score;
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
    toastTok += 1;
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

  function syncPips() {
    if (!pipsEl) return;
    while (pips.length < LIVES) {
      const iel = document.createElement('i');
      iel.className = 'pip on';
      pipsEl.appendChild(iel);
      pips.push(iel);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function syncModes() {
    if (modeCamp) modeCamp.setAttribute('aria-pressed', G.kind === 'campaign' ? 'true' : 'false');
    if (modeEnd) modeEnd.setAttribute('aria-pressed', G.kind === 'hunt' ? 'true' : 'false');
  }

  function kitsLeft() {
    let n = 0;
    for (let i = 0; i < G.kits.length; i++) if (!G.kits[i].got) n += 1;
    return n;
  }

  function liveGuards() {
    let n = 0;
    for (let i = 0; i < G.guards.length; i++) if (G.guards[i].alive) n += 1;
    return n;
  }

  function specNow() {
    if (G.kind === 'campaign') return INFIL[Math.min(G.stage, INFIL.length - 1)];
    const w = G.wave;
    return {
      name: '第 ' + w + ' 室',
      kits: Math.min(6, 2 + ((w - 1) * 0.55 | 0)),
      guards: Math.min(10, 4 + ((w - 1) * 0.7 | 0)),
      bombs: Math.min(6, 2 + ((w - 1) * 0.45 | 0)),
      gates: Math.min(5, 2 + ((w - 1) * 0.35 | 0)),
      vis: Math.min(9.2, 6.8 + (w - 1) * 0.22),
      gSpd: Math.min(2.55, 1.75 + (w - 1) * 0.09),
      chase: Math.min(3.7, 2.85 + (w - 1) * 0.1)
    };
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && G.comboT > 0);
    if (stageLabel) {
      if (G.kind === 'hunt') {
        stageLabel.textContent = G.mode === 'title' ? '追杀' : ('追杀 · ' + specNow().name);
      } else {
        const st = INFIL[Math.min(G.stage, INFIL.length - 1)];
        stageLabel.textContent = G.mode === 'title'
          ? '潜入'
          : ('潜入 ' + (G.stage + 1) + '/' + INFIL.length + ' · ' + st.name);
      }
      stageLabel.classList.toggle('hot', G.combo >= 3);
    }
    if (tagLabel) {
      const left = kitsLeft();
      const need = G.kitNeed || 0;
      const got = need - left;
      if (G.opened) {
        tagLabel.textContent = '出口开了';
        tagLabel.className = 'hot';
      } else if (G.mode === 'title') {
        tagLabel.textContent = '箱 —';
        tagLabel.className = '';
      } else {
        tagLabel.textContent = '箱 ' + got + '/' + need;
        tagLabel.className = left === 0 ? 'hot' : '';
      }
    }
    syncPips();
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
      if (ovKicker) ovKicker.textContent = 'DAG';
      if (ovTitle) ovTitle.textContent = '斗篷';
      if (ovLead) ovLead.innerHTML = '迷宫里摸公文箱，空格丢出匕首。<br />匕会扎进墙，走过去捡回来。被守卫抓住掉命。';
      if (ovOps) ovOps.textContent = OPS;
    } else if (kind === 'win') {
      if (ovKicker) ovKicker.textContent = 'CLEAR';
      if (ovTitle) ovTitle.textContent = '撤出了';
      if (ovLead) ovLead.textContent = '八室潜入完成。分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '');
      if (ovOps) ovOps.textContent = 'R 重开随时可用';
      if (ovAgain) ovAgain.textContent = '再潜入';
      if (ovMenu) ovMenu.textContent = '换模式';
    } else {
      if (ovKicker) ovKicker.textContent = 'CAUGHT';
      if (ovTitle) ovTitle.textContent = G.why || '被抓住了';
      const tail = G.kind === 'hunt' ? ('撑到第 ' + G.wave + ' 室。') : '';
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
    G.mult = multOf(G.combo);
    if (G.combo >= 2) audio.combo(G.combo);
    if (G.mult > prev) showChain(G.mult);
  }

  function resetFx() {
    particles.length = 0;
    pops.length = 0;
    rings.length = 0;
    trails.length = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
  }

  function resetDagger() {
    G.dagger.state = 'hand';
    G.dagger.x = G.player.x;
    G.dagger.y = G.player.y;
    G.dagger.vx = 0;
    G.dagger.vy = 0;
    G.dagger.ang = 0;
    G.dagger.dir = G.player.dir;
    G.throwCd = 0;
    G.pickLock = 0;
  }

  function pickEmpty(rng, seen, avoid, minDist, gap) {
    const spots = [];
    const g0 = gap == null ? 1.25 : gap;
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 2; c < COLS - 2; c++) {
        const t = G.grid[idx(c, r)];
        if (t === WALL || t === EXIT) continue;
        if (!seen[idx(c, r)]) continue;
        const x = c + 0.5;
        const y = r + 0.5;
        if (hypot(x - (SPAWN_C + 0.5), y - (SPAWN_R + 0.5)) < minDist) continue;
        let ok = true;
        for (let i = 0; i < avoid.length; i++) {
          if (hypot(x - avoid[i].x, y - avoid[i].y) < g0) {
            ok = false;
            break;
          }
        }
        if (!ok) continue;
        spots.push({ c: c, r: r, x: x, y: y });
      }
    }
    if (!spots.length) return null;
    return spots[(rng() * spots.length) | 0];
  }

  function spawnStuff(spec, rng) {
    const seen = floodOne(G.grid, SPAWN_C, SPAWN_R);
    const avoid = [{ x: SPAWN_C + 0.5, y: SPAWN_R + 0.5 }];
    G.kits = [];
    G.bombs = [];
    G.guards = [];

    function fillKind(n, minDist, make) {
      let left = n;
      const dists = [minDist, Math.max(1.6, minDist - 0.8), 1.4];
      for (let d = 0; d < dists.length && left > 0; d++) {
        while (left > 0) {
          const p = pickEmpty(rng, seen, avoid, dists[d], d === 0 ? 1.3 : 1.05);
          if (!p) break;
          make(p);
          avoid.push(p);
          left -= 1;
        }
      }
    }

    fillKind(spec.kits, 3.2, function (p) {
      G.kits.push({ x: p.x, y: p.y, got: false, bob: rng() * TAU });
    });
    G.kitNeed = G.kits.length;
    G.kitGot = 0;
    G.opened = G.kitNeed === 0;

    fillKind(spec.bombs, 3.4, function (p) {
      G.bombs.push({ x: p.x, y: p.y, alive: true, fuse: rng() * TAU });
    });

    fillKind(spec.guards, 4.2, function (p) {
      const dir = (rng() * 4) | 0;
      G.guards.push({
        x: p.x,
        y: p.y,
        dir: dir,
        fx: DX[dir],
        fy: DY[dir],
        r: G_R,
        alive: true,
        state: 'patrol',
        alertT: 0,
        searchT: 0,
        thinkT: rng() * 0.25,
        walk: rng() * TAU,
        lx: p.x,
        ly: p.y,
        vis: spec.vis,
        rgb: G.guards.length % 2 ? HOT : ORG
      });
    });
  }

  function buildRoom() {
    const spec = specNow();
    const seed0 = G.roomId * 7919 + (G.kind === 'hunt' ? 17 : 3) + G.wave * 13 + G.stage * 41;
    G.grid = makeGrid(seed0, spec.gates);
    G.vis = spec.vis;
    G.gSpd = spec.gSpd;
    G.chase = spec.chase;
    G.opened = false;
    G.player.x = SPAWN_C + 0.5;
    G.player.y = SPAWN_R + 0.5;
    G.player.fx = 1;
    G.player.fy = 0;
    G.player.dir = 1;
    resetDagger();
    spawnStuff(spec, rngSeed(seed0 + 333));
    G.ready = 0.38;
    G.invuln = 0.7;
    G.cloak = 0;
    G.exitNag = 0;
    resetFx();
  }

  function startGame(kind) {
    G.kind = kind === 'hunt' ? 'hunt' : 'campaign';
    G.mode = 'play';
    G.stage = 0;
    G.wave = 1;
    G.roomId = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.deadT = 0;
    G.why = '';
    buildRoom();
    hideOverlay();
    audio.start();
    const spec = specNow();
    toast(G.kind === 'hunt' ? '追杀 · 守卫更多更快' : ('潜入 · ' + spec.name), G.kind === 'hunt', G.kind !== 'hunt');
    setHint(G.kind === 'hunt' ? '追杀 · 守卫更密 · 丢匕再捡' : '摸箱丢匕 · 扎墙再捡 · 出口出逃', G.kind === 'hunt' ? 'warn' : '');
    syncHud();
  }

  function startCampaign() { startGame('campaign'); }
  function startHunt() { startGame('hunt'); }

  function bootTitle() {
    G.mode = 'title';
    G.kind = 'campaign';
    G.stage = 0;
    G.wave = 1;
    G.roomId = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    buildRoom();
    G.invuln = 99;
    G.cloak = 0;
    showOverlay('title');
    setHint('WASD 走 · 空格丢匕 · 捡箱出逃 · R 重开');
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
    G.mode = 'win';
    audio.win();
    kick('win-flash');
    screenFlash(GOLD, 0.45);
    hitStop(0.08);
    showOverlay('win');
    setHint('撤出了 · R 再来', 'hot');
    syncHud();
  }

  function loseRun(why) {
    if (G.mode !== 'play') return;
    G.mode = 'lose';
    G.why = why;
    fireHold = false;
    audio.lose();
    kick('die');
    screenFlash(HOT, 0.5);
    hitStop(0.08);
    showOverlay('lose');
    setHint('R 重开随时可用', 'warn');
    syncHud();
  }

  function hurtPlayer(why) {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    G.deadT = 0.82;
    G.lives -= 1;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.cloak = 0;
    resetDagger();
    audio.hurt();
    kick('die');
    screenFlash(HOT, 0.42);
    hitStop(0.07);
    G.shake = Math.max(G.shake, 8);
    emit(22, {
      x: G.player.x, y: G.player.y, j: 0.18,
      vx0: -7, vx1: 7, vy0: -8, vy1: 5,
      life: 0.45, r0: 0.04, r1: 0.12, rgb: CYN, g: 6
    });
    spawnRing(G.player.x, G.player.y, MAG);
    G.why = why;
    toast(why, true, false);
    syncHud();
  }

  function finishDeath() {
    if (G.lives <= 0) {
      loseRun(G.why || '被抓住了');
      return;
    }
    G.player.x = SPAWN_C + 0.5;
    G.player.y = SPAWN_R + 0.5;
    G.player.fx = 1;
    G.player.fy = 0;
    G.player.dir = 1;
    resetDagger();
    G.invuln = 1.45;
    G.deadT = 0;
    G.ready = 0.16;
    G.cloak = 0.9;
    toast('剩余 ' + G.lives + ' 命', true, false);
    syncHud();
  }

  function killGuard(g, how) {
    if (!g.alive) return;
    g.alive = false;
    g.state = 'dead';
    audio.hit();
    emit(18, {
      x: g.x, y: g.y, j: 0.16,
      vx0: -8, vx1: 8, vy0: -9, vy1: 5,
      life: 0.42, r0: 0.04, r1: 0.13, rgb: g.rgb, g: 7
    });
    spawnRing(g.x, g.y, g.rgb);
    if (G.mode !== 'play') return;
    const base = how === 'bomb' ? 110 : 90;
    bumpCombo();
    addScore(base * G.mult, g.x, g.y);
    hitStop(0.042 + Math.min(0.038, G.combo * 0.006));
    G.shake = Math.max(G.shake, 4 + Math.min(4, G.combo));
    G.punch = 0.97;
    kick('boom');
  }

  function explodeAt(x, y) {
    const queue = [{ x: x, y: y }];
    const seenB = [];
    let chain = 0;
    while (queue.length) {
      const cur = queue.pop();
      chain += 1;
      audio.boom();
      emit(20, {
        x: cur.x, y: cur.y, j: 0.2,
        vx0: -9, vx1: 9, vy0: -10, vy1: 6,
        life: 0.5, r0: 0.05, r1: 0.16, rgb: ORG, g: 8
      });
      emit(8, {
        x: cur.x, y: cur.y, j: 0.1,
        vx0: -5, vx1: 5, vy0: -6, vy1: 3,
        life: 0.32, r0: 0.03, r1: 0.08, rgb: GOLD, g: 4
      });
      spawnRing(cur.x, cur.y, HOT);
      for (let i = 0; i < G.guards.length; i++) {
        const g = G.guards[i];
        if (!g.alive) continue;
        if (hypot(g.x - cur.x, g.y - cur.y) < 1.72) killGuard(g, 'bomb');
      }
      if (G.mode === 'play' && G.deadT <= 0) {
        if (hypot(G.player.x - cur.x, G.player.y - cur.y) < 1.38) hurtPlayer('踩到雷了');
      }
      for (let i = 0; i < G.bombs.length; i++) {
        const b = G.bombs[i];
        if (!b.alive) continue;
        if (seenB.indexOf(i) >= 0) continue;
        if (hypot(b.x - cur.x, b.y - cur.y) < 1.78) {
          b.alive = false;
          seenB.push(i);
          queue.push({ x: b.x, y: b.y });
        }
      }
    }
    if (chain > 1 && G.mode === 'play') {
      bumpCombo();
      addScore(40 * chain * G.mult, x, y);
      showChain(Math.max(G.mult, chain));
    }
    hitStop(0.05 + Math.min(0.03, chain * 0.012));
    G.shake = Math.max(G.shake, 7);
    screenFlash(ORG, 0.38);
    kick('boom');
  }

  function throwDagger(dx, dy) {
    if (G.mode !== 'play' || G.deadT > 0 || G.ready > 0) return;
    if (G.dagger.state !== 'hand') return;
    if (G.throwCd > 0) return;
    const dir = snap4(dx, dy);
    G.player.dir = dir;
    G.player.fx = DX[dir];
    G.player.fy = DY[dir];
    const ux = DX[dir];
    const uy = DY[dir];
    G.dagger.state = 'fly';
    G.dagger.dir = dir;
    G.dagger.x = G.player.x + ux * 0.38;
    G.dagger.y = G.player.y + uy * 0.38;
    G.dagger.vx = ux * D_SPD;
    G.dagger.vy = uy * D_SPD;
    G.dagger.ang = Math.atan2(uy, ux);
    G.throwCd = 0.16;
    G.pickLock = 0.22;
    audio.throw();
    screenFlash(GOLD, 0.1);
    G.punch = 0.982;
    emit(6, {
      x: G.dagger.x, y: G.dagger.y, j: 0.04,
      vx0: ux * 2, vx1: ux * 7, vy0: uy * 2, vy1: uy * 7,
      life: 0.16, r0: 0.03, r1: 0.07, rgb: GOLD, g: 0
    });
  }

  function stickDagger(x, y) {
    G.dagger.state = 'stuck';
    G.dagger.x = x;
    G.dagger.y = y;
    G.dagger.vx = 0;
    G.dagger.vy = 0;
    G.pickLock = Math.max(G.pickLock, 0.18);
    audio.stick();
    hitStop(0.032);
    G.shake = Math.max(G.shake, 2.4);
    emit(7, {
      x: x, y: y, j: 0.06,
      vx0: -3, vx1: 3, vy0: -4, vy1: 2,
      life: 0.22, r0: 0.03, r1: 0.07, rgb: GOLD, g: 3
    });
  }

  function grabDagger() {
    G.dagger.state = 'hand';
    G.dagger.vx = 0;
    G.dagger.vy = 0;
    audio.grab();
    emit(5, {
      x: G.player.x, y: G.player.y, j: 0.08,
      vx0: -2, vx1: 2, vy0: -3, vy1: 1,
      life: 0.18, r0: 0.03, r1: 0.06, rgb: CYN, g: 0
    });
  }

  function collectKit(k) {
    if (k.got) return;
    k.got = true;
    G.kitGot += 1;
    bumpCombo();
    addScore(120 * G.mult, k.x, k.y);
    audio.kit();
    hitStop(0.036);
    G.punch = 0.97;
    G.cloak = G.kind === 'hunt' ? 0.55 : 0.92;
    screenFlash(GOLD, 0.22);
    spawnRing(k.x, k.y, GOLD);
    emit(18, {
      x: k.x, y: k.y, j: 0.14,
      vx0: -6, vx1: 6, vy0: -8, vy1: 3,
      life: 0.48, r0: 0.04, r1: 0.12, rgb: GOLD, g: 5
    });
    emit(8, {
      x: k.x, y: k.y, j: 0.08,
      vx0: -3, vx1: 3, vy0: -5, vy1: 1,
      life: 0.3, r0: 0.03, r1: 0.07, rgb: WHT, g: 2
    });
    kick('thump');
    if (kitsLeft() === 0) {
      G.opened = true;
      audio.door();
      toast('出口开了', false, true);
      setHint('出口开了 · 往东撤', 'hot');
    }
    syncHud();
  }

  function alertGuard(g) {
    if (g.state === 'alert' || g.state === 'chase') return;
    g.state = 'alert';
    g.alertT = 0.4;
    g.lx = G.player.x;
    g.ly = G.player.y;
    g.searchT = 0;
    audio.alert();
    kick('alert');
    screenFlash(HOT, 0.36);
    hitStop(0.045);
    spawnPop(g.x, g.y - 0.45, '!', HOT);
    toast('发现了', true, false);
  }

  function guardSees(g) {
    if (G.cloak > 0 || G.invuln > 0 || G.deadT > 0) return false;
    const dx = G.player.x - g.x;
    const dy = G.player.y - g.y;
    const dist = hypot(dx, dy);
    if (dist > g.vis || dist < 0.05) return false;
    const fx = DX[g.dir];
    const fy = DY[g.dir];
    if ((dx * fx + dy * fy) / dist < 0.32) return false;
    return hasLOS(g.x, g.y, G.player.x, G.player.y);
  }

  function aheadClear(x, y, dir, rad) {
    const nx = x + DX[dir] * 0.42;
    const ny = y + DY[dir] * 0.42;
    return !blocked(nx, ny, rad, DX[dir], DY[dir]);
  }

  function pickPatrolDir(g, rngTurn) {
    const opts = [];
    for (let d = 0; d < 4; d++) {
      if (aheadClear(g.x, g.y, d, g.r)) opts.push(d);
    }
    if (!opts.length) return (g.dir + 2) & 3;
    if (aheadClear(g.x, g.y, g.dir, g.r) && !rngTurn) return g.dir;
    const filtered = opts.filter(function (d) { return d !== ((g.dir + 2) & 3); });
    const pool = filtered.length ? filtered : opts;
    return pool[(Math.random() * pool.length) | 0];
  }

  function chaseDir(g) {
    const tx = g.state === 'search' ? g.lx : G.player.x;
    const ty = g.state === 'search' ? g.ly : G.player.y;
    const dx = tx - g.x;
    const dy = ty - g.y;
    const order = [];
    if (Math.abs(dx) >= Math.abs(dy)) {
      order.push(dx >= 0 ? 1 : 3, dy >= 0 ? 2 : 0, dy >= 0 ? 0 : 2, dx >= 0 ? 3 : 1);
    } else {
      order.push(dy >= 0 ? 2 : 0, dx >= 0 ? 1 : 3, dx >= 0 ? 3 : 1, dy >= 0 ? 0 : 2);
    }
    for (let i = 0; i < order.length; i++) {
      if (aheadClear(g.x, g.y, order[i], g.r)) return order[i];
    }
    return g.dir;
  }

  function updateGuards(dt) {
    for (let i = 0; i < G.guards.length; i++) {
      const g = G.guards[i];
      if (!g.alive) continue;
      g.walk += dt * 7;
      g.thinkT -= dt;
      if (g.state === 'alert') {
        g.alertT -= dt;
        if (g.alertT <= 0) g.state = 'chase';
        continue;
      }
      if (guardSees(g)) {
        if (g.state !== 'chase') alertGuard(g);
        else {
          g.lx = G.player.x;
          g.ly = G.player.y;
          g.searchT = 0;
        }
      } else if (g.state === 'chase') {
        g.searchT += dt;
        if (g.searchT > 1.35) {
          g.state = 'search';
          g.searchT = 1.6;
        }
      } else if (g.state === 'search') {
        g.searchT -= dt;
        if (g.searchT <= 0) g.state = 'patrol';
      }

      let spd = G.gSpd;
      if (g.state === 'chase') spd = G.chase;
      else if (g.state === 'search') spd = G.gSpd * 1.15;
      else if (g.state === 'patrol' && g.thinkT <= 0) {
        g.dir = pickPatrolDir(g, Math.random() < 0.18);
        g.thinkT = 0.28 + Math.random() * 0.7;
      }
      if (g.state === 'chase' || g.state === 'search') {
        if (g.thinkT <= 0) {
          g.dir = chaseDir(g);
          g.thinkT = 0.08;
        }
      }
      if (!aheadClear(g.x, g.y, g.dir, g.r)) {
        g.dir = g.state === 'patrol' ? pickPatrolDir(g, true) : chaseDir(g);
      }
      g.fx = DX[g.dir];
      g.fy = DY[g.dir];
      tryMove(g, g.fx * spd * dt, g.fy * spd * dt, g.r);

      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
        if (hypot(g.x - G.player.x, g.y - G.player.y) < g.r + P_R - 0.02) {
          hurtPlayer('被抓住了');
        }
      }
    }
  }

  function updateDagger(dt) {
    const d = G.dagger;
    if (d.state === 'hand') {
      d.x = G.player.x;
      d.y = G.player.y;
      d.dir = G.player.dir;
      d.ang = Math.atan2(G.player.fy, G.player.fx);
      return;
    }
    if (d.state === 'stuck') {
      d.ang += dt * 0.4;
      if (G.pickLock <= 0 && hypot(d.x - G.player.x, d.y - G.player.y) < 0.52) grabDagger();
      return;
    }
    if (d.state !== 'fly') return;
    const steps = 5;
    const h = dt / steps;
    for (let s = 0; s < steps; s++) {
      const nx = d.x + d.vx * h;
      const ny = d.y + d.vy * h;
      if (cellAt(nx, ny) === WALL || !inb(nx | 0, ny | 0)) {
        stickDagger(d.x, d.y);
        return;
      }
      d.x = nx;
      d.y = ny;
      d.ang += 22 * h;
      trails.push({ x: d.x, y: d.y, t: 0.16, rgb: GOLD });
      for (let i = 0; i < G.bombs.length; i++) {
        const b = G.bombs[i];
        if (!b.alive) continue;
        if (hypot(d.x - b.x, d.y - b.y) < 0.38) {
          b.alive = false;
          explodeAt(b.x, b.y);
          stickDagger(b.x, b.y);
          return;
        }
      }
      for (let i = 0; i < G.guards.length; i++) {
        const g = G.guards[i];
        if (!g.alive) continue;
        if (hypot(d.x - g.x, d.y - g.y) < g.r + 0.14) {
          killGuard(g, 'dag');
          emit(6, {
            x: d.x, y: d.y, j: 0.05,
            vx0: d.vx * 0.04, vx1: d.vx * 0.12, vy0: d.vy * 0.04, vy1: d.vy * 0.12,
            life: 0.16, r0: 0.03, r1: 0.07, rgb: GOLD, g: 0
          });
        }
      }
    }
  }

  function updateKitsBombs() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    for (let i = 0; i < G.kits.length; i++) {
      const k = G.kits[i];
      if (k.got) continue;
      if (hypot(k.x - G.player.x, k.y - G.player.y) < 0.46) collectKit(k);
    }
    for (let i = 0; i < G.bombs.length; i++) {
      const b = G.bombs[i];
      if (!b.alive) continue;
      let boom = hypot(b.x - G.player.x, b.y - G.player.y) < 0.4;
      if (!boom) {
        for (let k = 0; k < G.guards.length; k++) {
          const g = G.guards[k];
          if (!g.alive) continue;
          if (hypot(b.x - g.x, b.y - g.y) < 0.38) { boom = true; break; }
        }
      }
      if (boom) {
        b.alive = false;
        explodeAt(b.x, b.y);
      }
    }
  }

  function checkExit() {
    if (G.mode !== 'play' || G.deadT > 0 || G.ready > 0) return;
    const t = cellAt(G.player.x, G.player.y);
    const near = G.player.x > COLS - 1.15 && Math.abs(G.player.y - (EXIT_R + 0.5)) < 1.4;
    if (t !== EXIT && !near) return;
    if (kitsLeft() > 0) {
      if (G.exitNag <= 0) {
        toast('还缺 ' + kitsLeft() + ' 只箱', true, false);
        G.exitNag = 1.1;
      }
      if (G.player.x > COLS - 0.72) G.player.x = COLS - 0.78;
      return;
    }
    const bonus = 180 + (G.kind === 'campaign' ? G.stage * 30 : G.wave * 24);
    addScore(bonus + (liveGuards() === 0 ? 80 : 0), G.player.x, G.player.y);
    audio.door();
    kick('win-flash');
    screenFlash(GOLD, 0.28);
    if (G.kind === 'campaign' && G.stage >= INFIL.length - 1) {
      winRun();
      return;
    }
    if (G.kind === 'campaign') G.stage += 1;
    else G.wave += 1;
    G.roomId += 1;
    G.comboT = Math.max(G.comboT, 0.6);
    buildRoom();
    const spec = specNow();
    toast(G.kind === 'hunt' ? spec.name : (spec.name + ' · 第 ' + (G.stage + 1) + ' 室'), false, true);
    setHint(G.kind === 'hunt' ? '追杀 · 守卫更密 · 丢匕再捡' : '摸箱丢匕 · 扎墙再捡 · 出口出逃', G.kind === 'hunt' ? 'warn' : '');
    syncHud();
  }

  function wishDir() {
    let dx = 0;
    let dy = 0;
    if (keys.u) dy -= 1;
    if (keys.d) dy += 1;
    if (keys.l) dx -= 1;
    if (keys.r) dx += 1;
    if (ptr.down && ptr.dragging) {
      dx = ptr.dx;
      dy = ptr.dy;
    }
    return { dx: dx, dy: dy };
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    const w = wishDir();
    if (w.dx !== 0 || w.dy !== 0) {
      const len = hypot(w.dx, w.dy) || 1;
      const ux = w.dx / len;
      const uy = w.dy / len;
      tryMove(G.player, ux * P_SPD * dt, uy * P_SPD * dt, P_R);
      G.player.dir = snap4(w.dx, w.dy);
      G.player.fx = DX[G.player.dir];
      G.player.fy = DY[G.player.dir];
      G.player.walk += dt * 10;
      if (G.cloak > 0) {
        trails.push({ x: G.player.x, y: G.player.y, t: 0.22, rgb: MAG });
      }
    }
    if ((fireHold || fireLatch) && G.dagger.state === 'hand' && G.throwCd <= 0) {
      fireLatch = false;
      throwDagger(G.player.fx, G.player.fy);
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
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.34) rings.splice(i, 1);
    }
    for (let i = trails.length - 1; i >= 0; i--) {
      trails[i].t -= dt;
      if (trails[i].t <= 0) trails.splice(i, 1);
    }
    for (let i = 0; i < G.kits.length; i++) G.kits[i].bob += dt * 3.2;
    for (let i = 0; i < G.bombs.length; i++) G.bombs[i].fuse += dt * 6;
  }

  function demoThink(dt) {
    if ((G.t * 2 | 0) !== ((G.t - dt) * 2 | 0)) {
      G.player.dir = (G.player.dir + ((Math.random() * 3) | 0) - 1 + 4) & 3;
      G.player.fx = DX[G.player.dir];
      G.player.fy = DY[G.player.dir];
    }
    tryMove(G.player, G.player.fx * 1.5 * dt, G.player.fy * 1.5 * dt, P_R);
    G.player.walk += dt * 8;
    updateGuards(dt);
    updateDagger(dt);
  }

  function playSim(dt) {
    G.invuln = Math.max(0, G.invuln - dt);
    G.cloak = Math.max(0, G.cloak - dt);
    G.throwCd = Math.max(0, G.throwCd - dt);
    G.pickLock = Math.max(0, G.pickLock - dt);
    G.exitNag = Math.max(0, G.exitNag - dt);
    if (G.ready > 0) G.ready -= dt;
    updatePlayer(dt);
    updateDagger(dt);
    updateGuards(dt);
    updateKitsBombs();
    checkExit();
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.45);
      return;
    }
    if (G.deadT > 0) {
      G.deadT -= dt;
      updateFx(dt);
      updateDagger(dt);
      if (G.deadT <= 0) finishDeath();
      return;
    }
    if (G.mode === 'title') demoThink(dt);
    else if (G.mode === 'play') playSim(dt);
    updateFx(dt);
  }

  function sx(x) { return ox + x * cell; }
  function sy(y) { return oy + y * cell; }

  function drawWall(c, r) {
    const x = sx(c);
    const y = sy(r);
    ctx.fillStyle = '#160b24';
    ctx.fillRect(x, y, cell + 0.6, cell + 0.6);
    ctx.fillStyle = 'rgba(177, 77, 255, 0.16)';
    ctx.fillRect(x, y, cell, 2);
    ctx.fillRect(x, y, 2, cell);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(x + 2, y + cell - 3, cell - 2, 3);
  }

  function drawOneWay(c, r, t) {
    const x = sx(c + 0.5);
    const y = sy(r + 0.5);
    ctx.save();
    ctx.translate(x, y);
    let rot = 0;
    if (t === ONE_E) rot = 0;
    else if (t === ONE_S) rot = Math.PI / 2;
    else if (t === ONE_W) rot = Math.PI;
    else rot = -Math.PI / 2;
    ctx.rotate(rot);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
    ctx.fillRect(-cell * 0.42, -cell * 0.42, cell * 0.84, cell * 0.84);
    ctx.fillStyle = rgba(CYN, 0.55 + 0.2 * Math.sin(G.t * 5));
    ctx.beginPath();
    ctx.moveTo(-cell * 0.18, -cell * 0.22);
    ctx.lineTo(cell * 0.22, 0);
    ctx.lineTo(-cell * 0.18, cell * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawExit(c, r) {
    const x = sx(c);
    const y = sy(r);
    const open = G.opened;
    ctx.fillStyle = open ? 'rgba(255, 227, 107, 0.22)' : 'rgba(177, 77, 255, 0.12)';
    ctx.fillRect(x, y, cell, cell);
    ctx.strokeStyle = open ? rgba(GOLD, 0.8) : rgba(MAG, 0.45);
    ctx.lineWidth = Math.max(1.5, cell * 0.08);
    ctx.strokeRect(x + 3, y + 3, cell - 6, cell - 6);
    if (open) {
      ctx.fillStyle = rgba(GOLD, 0.18 + 0.12 * Math.sin(G.t * 6));
      ctx.fillRect(x + 6, y + 6, cell - 12, cell - 12);
    }
  }

  function drawKit(k) {
    if (k.got) return;
    const bob = Math.sin(k.bob) * cell * 0.06;
    const x = sx(k.x);
    const y = sy(k.y) + bob;
    const w = cell * 0.42;
    const h = cell * 0.3;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(255, 227, 107, 0.18)';
    ctx.beginPath();
    ctx.arc(0, 0, cell * 0.34, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffe36b';
    ctx.fillRect(-w * 0.5, -h * 0.2, w, h);
    ctx.fillStyle = '#ffb84a';
    ctx.fillRect(-w * 0.5, -h * 0.2, w, h * 0.35);
    ctx.strokeStyle = '#ffe9a8';
    ctx.lineWidth = Math.max(1.2, cell * 0.06);
    ctx.beginPath();
    ctx.moveTo(-w * 0.18, -h * 0.2);
    ctx.lineTo(-w * 0.18, -h * 0.55);
    ctx.lineTo(w * 0.18, -h * 0.55);
    ctx.lineTo(w * 0.18, -h * 0.2);
    ctx.stroke();
    ctx.restore();
  }

  function drawBomb(b) {
    if (!b.alive) return;
    const x = sx(b.x);
    const y = sy(b.y);
    const blink = 0.55 + 0.45 * Math.sin(b.fuse);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(255, 58, 122, 0.14)';
    ctx.beginPath();
    ctx.arc(0, 0, cell * 0.32, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a0c14';
    ctx.beginPath();
    ctx.arc(0, 0, cell * 0.2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(ORG, 0.7);
    ctx.lineWidth = Math.max(1.2, cell * 0.05);
    ctx.stroke();
    ctx.strokeStyle = rgba(GOLD, blink);
    ctx.beginPath();
    ctx.moveTo(cell * 0.08, -cell * 0.18);
    ctx.quadraticCurveTo(cell * 0.18, -cell * 0.34, cell * 0.08, -cell * 0.4);
    ctx.stroke();
    ctx.fillStyle = rgba(HOT, blink);
    ctx.beginPath();
    ctx.arc(cell * 0.08, -cell * 0.42, cell * 0.05, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawGuard(g) {
    if (!g.alive) return;
    const x = sx(g.x);
    const y = sy(g.y) + Math.sin(g.walk) * cell * 0.03;
    const alert = g.state === 'alert' || g.state === 'chase';
    ctx.save();
    ctx.translate(x, y);
    const ang = Math.atan2(g.fy, g.fx);
    ctx.rotate(ang);
    if (!REDUCE) {
      ctx.fillStyle = rgba(g.rgb, alert ? 0.14 : 0.07);
      ctx.beginPath();
      ctx.moveTo(cell * 0.1, 0);
      ctx.lineTo(cell * g.vis * 0.55, cell * 0.38);
      ctx.lineTo(cell * g.vis * 0.55, -cell * 0.38);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = rgba(g.rgb, 0.95);
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-cell * 0.22, -cell * 0.18, cell * 0.46, cell * 0.36, cell * 0.08)
      : ctx.rect(-cell * 0.22, -cell * 0.18, cell * 0.46, cell * 0.36);
    ctx.fill();
    ctx.fillStyle = '#140814';
    ctx.fillRect(cell * 0.08, -cell * 0.12, cell * 0.16, cell * 0.24);
    ctx.fillStyle = alert ? '#ff4d7a' : '#7af6ff';
    ctx.fillRect(cell * 0.12, -cell * 0.07, cell * 0.08, cell * 0.05);
    ctx.fillRect(cell * 0.12, 0.02, cell * 0.08, cell * 0.05);
    ctx.restore();
    if (alert) {
      ctx.fillStyle = rgba(HOT, 0.85 + 0.15 * Math.sin(G.t * 14));
      ctx.font = '800 ' + Math.max(12, cell * 0.42) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('!', x, y - cell * 0.38);
    }
  }

  function drawDaggerWorld() {
    const d = G.dagger;
    if (d.state === 'hand') return;
    const x = sx(d.x);
    const y = sy(d.y);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(d.ang);
    if (d.state === 'stuck') {
      const pulse = 0.55 + 0.45 * Math.sin(G.t * 8);
      ctx.shadowColor = rgba(GOLD, pulse);
      ctx.shadowBlur = 8;
    }
    ctx.fillStyle = '#ffe36b';
    ctx.beginPath();
    ctx.moveTo(cell * 0.28, 0);
    ctx.lineTo(-cell * 0.08, -cell * 0.1);
    ctx.lineTo(-cell * 0.08, cell * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c9a24a';
    ctx.fillRect(-cell * 0.18, -cell * 0.05, cell * 0.12, cell * 0.1);
    ctx.restore();
  }

  function drawSpy() {
    const p = G.player;
    if (G.deadT > 0 && ((G.deadT * 18) | 0) % 2 === 0) return;
    const blink = G.invuln > 0 && G.invuln < 8 && ((G.invuln * 14) | 0) % 2 === 0;
    const x = sx(p.x);
    const y = sy(p.y);
    const ang = Math.atan2(p.fy, p.fx);
    const a = G.cloak > 0 ? 0.55 + 0.25 * Math.sin(G.t * 10) : (blink ? 0.45 : 1);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.globalAlpha = a;
    ctx.fillStyle = rgba(MAG, G.cloak > 0 ? 0.55 : 0.82);
    ctx.beginPath();
    ctx.moveTo(-cell * 0.02, 0);
    ctx.quadraticCurveTo(-cell * 0.42, cell * 0.28, -cell * 0.55, cell * 0.08);
    ctx.quadraticCurveTo(-cell * 0.42, -cell * 0.28, -cell * 0.02, 0);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.beginPath();
    ctx.arc(0, 0, cell * 0.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#071018';
    ctx.fillRect(cell * 0.02, -cell * 0.1, cell * 0.16, cell * 0.2);
    ctx.fillStyle = '#e8ffff';
    ctx.fillRect(cell * 0.08, -cell * 0.06, cell * 0.07, cell * 0.045);
    ctx.fillRect(cell * 0.08, 0.02, cell * 0.07, cell * 0.045);
    if (G.dagger.state === 'hand') {
      ctx.fillStyle = '#ffe36b';
      ctx.beginPath();
      ctx.moveTo(cell * 0.38, cell * 0.12);
      ctx.lineTo(cell * 0.12, cell * 0.04);
      ctx.lineTo(cell * 0.12, cell * 0.16);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function draw() {
    if (!ctx) return;
    ctx.fillStyle = '#04010c';
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.6 + 0.4 * Math.sin(G.t * 0.7 + m.p * 9));
      ctx.fillStyle = rgba(MAG, a);
      ctx.beginPath();
      ctx.arc(m.x * W, ((m.y + G.t * 0.012) % 1) * H, m.r, 0, TAU);
      ctx.fill();
    }

    ctx.save();
    const sh = REDUCE ? 0 : G.shake;
    if (sh > 0) {
      ctx.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);
    }
    const punch = REDUCE ? 1 : G.punch;
    if (punch !== 1) {
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(punch, 2 - punch);
      ctx.translate(-W * 0.5, -H * 0.5);
    }

    ctx.fillStyle = '#0a0614';
    ctx.fillRect(ox, oy, COLS * cell, ROWS * cell);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = G.grid[idx(c, r)];
        if (t === WALL) {
          drawWall(c, r);
        } else {
          if (((c + r) & 1) === 0) {
            ctx.fillStyle = 'rgba(177, 77, 255, 0.035)';
            ctx.fillRect(sx(c), sy(r), cell, cell);
          }
          if (t === EXIT) drawExit(c, r);
          else if (isOne(t)) drawOneWay(c, r, t);
        }
      }
    }

    ctx.strokeStyle = 'rgba(177, 77, 255, 0.22)';
    ctx.lineWidth = Math.max(1.5, cell * 0.06);
    ctx.strokeRect(ox + 0.5, oy + 0.5, COLS * cell - 1, ROWS * cell - 1);

    for (let i = 0; i < G.kits.length; i++) drawKit(G.kits[i]);
    for (let i = 0; i < G.bombs.length; i++) drawBomb(G.bombs[i]);

    for (let i = 0; i < trails.length; i++) {
      const q = trails[i];
      ctx.fillStyle = rgba(q.rgb, (q.t / 0.22) * 0.45);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), Math.max(1.2, cell * 0.08), 0, TAU);
      ctx.fill();
    }

    for (let i = 0; i < G.guards.length; i++) drawGuard(G.guards[i]);
    drawDaggerWorld();
    drawSpy();

    for (let i = 0; i < rings.length; i++) {
      const rg = rings[i];
      const a = 1 - rg.t / 0.34;
      ctx.strokeStyle = rgba(rg.rgb, a * 0.7);
      ctx.lineWidth = Math.max(1.2, cell * 0.06);
      ctx.beginPath();
      ctx.arc(sx(rg.x), sy(rg.y), cell * (0.2 + rg.t * 2.1), 0, TAU);
      ctx.stroke();
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

  function worldFromPtr(cx, cy) {
    const rect = canvas.getBoundingClientRect();
    const x = (cx - rect.left) * (W / rect.width);
    const y = (cy - rect.top) * (H / rect.height);
    return { x: (x - ox) / cell, y: (y - oy) / cell };
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
      const dir = snap4(dx, dy);
      ptr.dx = DX[dir];
      ptr.dy = DY[dir];
    }
  }

  function onPointerUp(e) {
    if (ptr.id != null && e.pointerId !== ptr.id) return;
    if (ptr.down && !ptr.dragging && !overlayBlocksPlay()) {
      const dx = ptr.x - G.player.x;
      const dy = ptr.y - G.player.y;
      if (hypot(dx, dy) > 0.05) throwDagger(dx, dy);
      else throwDagger(G.player.fx, G.player.fy);
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
    if (isSp) {
      fireHold = down;
      if (down && !e.repeat) fireLatch = true;
    }
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
        if (!overlayBlocksPlay()) throwDagger(G.player.fx, G.player.fy);
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
    fireLatch = false;
    ptr.down = false;
    ptr.dragging = false;
    ptr.dx = ptr.dy = 0;
  });

  if (btnCampaign) btnCampaign.addEventListener('click', function () { audio.ensure(); startCampaign(); });
  if (btnEndless) btnEndless.addEventListener('click', function () { audio.ensure(); startHunt(); });
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
    startHunt();
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
    setHint('滑动走 · 点按或匕丢出 · 捡箱出逃');
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
