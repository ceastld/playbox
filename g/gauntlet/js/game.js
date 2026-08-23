'use strict';

(function () {
  const COLS = 17;
  const ROWS = 11;
  const EMPTY = 0;
  const WALL = 1;
  const EXIT = 2;
  const FOOD = 3;
  const LOOT = 4;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const P_SPD = 4.48;
  const P_R = 0.28;
  const G_R = 0.38;
  const S_R = 0.13;
  const P_SHOT = 13.2;
  const FIRE_CD = 0.132;
  const MAX_SHOTS = 4;
  const MAX_MON = 14;
  const MAX_MON_HORDE = 20;
  const HP_START = 100;
  const HP_MAX = 140;
  const HP_FOOD = 32;
  const HP_LOW = 26;
  const COMBO_WIN = 1.42;
  const CONTACT_CD = 0.32;
  const MELEE_R = 0.7;
  const MELEE_CD = 0.22;
  const MELEE_DMG = 2;
  const BEST_KEY = 'playbox-gauntlet-best';
  const MUTE_KEY = 'playbox-gauntlet-mute';
  const AUTO_SPEED_KEY = 'playbox-gauntlet-auto-speed';
  const AUTO_SPEED_NAME = ['', '慢', '中', '快', '极快'];
  const AUTO_TIME = [0, 0.7, 1, 1.45, 2.85];
  const AUTO_OV_WAIT = [0, 0.85, 0.5, 0.22, 0.06];
  const DX = [0, 1, 0, -1];
  const DY = [-1, 0, 1, 0];
  const OPS = '方向键 / W S D 走 · 空格射击 · 贴身斩 · A 自动 · R 重开 · M 静音';

  const MAG = [255, 61, 138];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 122, 24];
  const HOT2 = [255, 177, 74];
  const WHT = [255, 244, 230];
  const GRN = [109, 255, 154];
  const PUR = [200, 107, 255];
  const BONE = [255, 200, 120];
  const ZOM = [122, 212, 106];

  const TYPE = {
    bone: { rgb: BONE, spd: 2.08, hp: 1, score: 50, dmg: 12, r: 0.3, immune: false },
    zombie: { rgb: ZOM, spd: 1.42, hp: 2, score: 80, dmg: 16, r: 0.32, immune: false },
    wraith: { rgb: PUR, spd: 2.38, hp: 1, score: 140, dmg: 10, r: 0.3, immune: true }
  };

  const FLOORS = [
    { name: '石门', gens: 2, bone: 2, zombie: 0, wraith: 0, spawn: 2.48, drain: 3.7, food: 3, loot: 2, hp: 3, rooms: 4 },
    { name: '骨道', gens: 2, bone: 1, zombie: 1, wraith: 0, spawn: 2.18, drain: 3.9, food: 3, loot: 2, hp: 4, rooms: 4 },
    { name: '食窖', gens: 3, bone: 1, zombie: 2, wraith: 0, spawn: 1.92, drain: 4.1, food: 5, loot: 3, hp: 4, rooms: 5 },
    { name: '血廊', gens: 3, bone: 1, zombie: 1, wraith: 1, spawn: 1.68, drain: 4.35, food: 4, loot: 3, hp: 5, rooms: 5 },
    { name: '影井', gens: 4, bone: 1, zombie: 1, wraith: 2, spawn: 1.46, drain: 4.6, food: 4, loot: 3, hp: 5, rooms: 5 },
    { name: '金门', gens: 4, bone: 1, zombie: 2, wraith: 1, spawn: 1.28, drain: 4.9, food: 5, loot: 4, hp: 6, rooms: 5 }
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
    if (dx === 0 && dy === 0) return [1, 0];
    if (Math.abs(dx) >= Math.abs(dy)) return [dx >= 0 ? 1 : -1, 0];
    return [0, dy >= 0 ? 1 : -1];
  }
  function multOf(combo) {
    return 1 + Math.min(4, combo >> 1);
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

  function blocked(x, y, rad) {
    const c0 = Math.max(0, (x - rad) | 0);
    const r0 = Math.max(0, (y - rad) | 0);
    const c1 = Math.min(COLS - 1, (x + rad) | 0);
    const r1 = Math.min(ROWS - 1, (y + rad) | 0);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (G.grid[idx(c, r)] === WALL && circleRect(x, y, rad, c, r, 1, 1)) return true;
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
      { c: 1, r: 3, w: 4, h: 5 },
      { c: 7, r: 1, w: 4, h: 3 },
      { c: 7, r: 7, w: 4, h: 3 },
      { c: 12, r: 3, w: 4, h: 5 }
    ];
    for (let i = 0; i < rooms.length; i++) carveRoom(grid, rooms[i]);
    carveH(grid, 3, 14, 5);
    carveV(grid, 2, 8, 8);
    return rooms;
  }

  function genMaze(seed, spec) {
    const rng = rngSeed(seed);
    const grid = new Uint8Array(COLS * ROWS);
    grid.fill(WALL);
    const rooms = [];
    const startH = 3 + (rng() * 3) | 0;
    const startR = 1 + ((ROWS - 2 - startH) * rng()) | 0;
    rooms.push({ c: 1, r: startR, w: 4, h: startH });
    carveRoom(grid, rooms[0]);

    const want = spec.rooms || 4;
    let tries = 0;
    while (rooms.length < want && tries < 80) {
      tries += 1;
      const w = 3 + (rng() * 3) | 0;
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
      if (rm.w >= 4 && rm.h >= 4 && rng() < 0.4) {
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
    if (empties < 28) return false;
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
    const base = FLOORS[Math.min(G.stage, FLOORS.length - 1)];
    if (G.kind !== 'horde') return base;
    return {
      name: base.name,
      gens: Math.min(6, base.gens + 1 + (G.stage >= 3 ? 1 : 0)),
      bone: base.bone + (G.stage >= 1 ? 1 : 0),
      zombie: base.zombie + 1,
      wraith: base.wraith + (G.stage >= 3 ? 1 : 0),
      spawn: Math.max(0.78, base.spawn * 0.72),
      drain: Math.min(7.2, base.drain + 1.5),
      food: Math.min(6, base.food + 1),
      loot: base.loot,
      hp: Math.min(7, base.hp + 1),
      rooms: base.rooms
    };
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

  function selfCheck() {
    const e = snap4(10, 0);
    if (e[0] !== 1 || e[1] !== 0) throw new Error('snap4 east');
    const n = snap4(0, -4);
    if (n[0] !== 0 || n[1] !== -1) throw new Error('snap4 north');
    const sw = snap4(-3, 3);
    if (sw[0] !== -1 || sw[1] !== 0) throw new Error('snap4 west-bias');
    if (idx(2, 1) !== COLS + 2) throw new Error('idx');
    if (multOf(0) !== 1 || multOf(2) !== 2 || multOf(8) !== 5) throw new Error('mult');
    if (TYPE.wraith.immune !== true) throw new Error('wraith immune');
    if (MELEE_DMG <= 1) throw new Error('melee stronger than shot');
    if (AUTO_TIME[3] !== 1.45 || AUTO_TIME[4] <= AUTO_TIME[3]) throw new Error('auto time');
    if (AUTO_TIME[1] >= AUTO_TIME[2] || AUTO_TIME[2] >= AUTO_TIME[3]) throw new Error('auto time order');
    if (AUTO_OV_WAIT[4] > AUTO_OV_WAIT[1]) throw new Error('auto ov');
    for (let i = 0; i < 36; i++) {
      const spec = FLOORS[i % FLOORS.length];
      const pack = genMaze(21 * i + 11, spec);
      const far = farthestCell(pack);
      pack.grid[idx(far.c, far.r)] = EXIT;
      pack.seen = floodReach(pack.grid, pack.sc, pack.sr);
      if (!mazeOk(pack)) throw new Error('maze connectivity seed ' + i);
      if (pack.grid[idx(far.c, far.r)] !== EXIT) throw new Error('exit missing ' + i);
      if (!pack.seen[idx(far.c, far.r)]) throw new Error('exit unreachable ' + i);
      if (far.c === pack.sc && far.r === pack.sr) throw new Error('exit on start ' + i);
      G.grid = pack.grid;
      G.gens = [];
      const pth = autoPathTo(pack.sc, pack.sr, far.c, far.r);
      if (!pth || pth.length < 2) throw new Error('auto path seed ' + i);
    }
    G.kind = 'clear';
    G.stage = 0;
    G.floorId = 1;
    G.hp = HP_START;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.deadT = 0;
    G.mode = 'play';
    G.why = '';
    G.lowWarned = false;
    buildFloor();
    autoOn = true;
    autoSpeed = 3;
    autoResetPlan();
    const seenCells = {};
    let cellN = 0;
    let fireN = 0;
    const x0 = G.player.x;
    const y0 = G.player.y;
    const samples = [];
    for (let i = 0; i < 720; i++) {
      autoThink(STEP);
      const id = (G.player.x | 0) + ',' + (G.player.y | 0);
      if (!seenCells[id]) {
        seenCells[id] = 1;
        cellN += 1;
      }
      if (fireHold || G.shots.length) fireN += 1;
      if (process.env && process.env.GAUNTLET_AI_LOG && i % 120 === 40) {
        const east = G.grid[idx((G.player.x | 0) + 1, G.player.y | 0)];
        samples.push({
          i: i,
          pos: [+G.player.x.toFixed(2), +G.player.y.toFixed(2)],
          wish: [autoWish.x, autoWish.y],
          goal: autoGoal && autoGoal.kind,
          path0: autoGoal && autoGoal.path && autoGoal.path[0],
          east: east,
          stuck: +autoStuck.toFixed(2),
          fire: fireHold
        });
      }
      playSim(STEP);
      if (G.mode !== 'play') break;
    }
    const net = hypot(G.player.x - x0, G.player.y - y0);
    if (cellN < 2 || net < 0.45) throw new Error('AI should leave spawn');
    if (fireN < 8 && liveGens() + liveMons() > 0) throw new Error('AI should shoot');
    if (cellN < 3 && G.score <= 0 && fireN < 20) throw new Error('AI should fight or loot');
    if (typeof process !== 'undefined' && process.env && process.env.GAUNTLET_AI_LOG) {
      const gens = G.gens.filter(function (g) { return g.alive; }).map(function (g) {
        return { x: +g.x.toFixed(2), y: +g.y.toFixed(2), d: +hypot(g.x - G.player.x, g.y - G.player.y).toFixed(2) };
      });
      console.log('ai ' + JSON.stringify({ cellN: cellN, net: +net.toFixed(2), score: G.score, fireN: fireN, hp: +G.hp.toFixed(1), gens: liveGens(), mons: liveMons(), pos: [+G.player.x.toFixed(2), +G.player.y.toFixed(2)], goal: autoGoal && autoGoal.kind, wish: [autoWish.x, autoWish.y], genPos: gens, start: [G.startC, G.startR], samples: samples }));
    }
    autoOn = false;
    fireHold = false;
    return true;
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
      this.beep(880, 0.05, 'square', 0.044, 260);
      this.beep(1420, 0.032, 'sawtooth', 0.026, 620);
    },
    slash() {
      this.ensure();
      this.noise(0.07, 0.05, 420);
      this.beep(520, 0.07, 'sawtooth', 0.05, 180);
      this.beep(1240, 0.045, 'square', 0.03, 720);
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
    clang() {
      this.ensure();
      this.beep(240, 0.09, 'square', 0.04, 90);
      this.noise(0.06, 0.03, 1100);
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
  const btnClear = el('btn-clear');
  const btnHorde = el('btn-horde');
  const ovAgain = el('ov-again');
  const ovMenu = el('ov-menu');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
  const btnAuto = el('btn-auto');
  const speedEl = el('speed');
  const speedLab = el('speed-lab');
  const modeClear = el('mode-clear');
  const modeHorde = el('mode-horde');
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
  let lastAxis = 0;

  const keys = { u: false, d: false, l: false, r: false };
  const ptr = { down: false, id: null, sx: 0, sy: 0, x: 0, y: 0, dragging: false, dx: 0, dy: 0 };
  const autoWish = { x: 0, y: 0 };
  let autoOn = false;
  let autoSpeed = 3;
  let autoOvWait = 0;
  let autoStuck = 0;
  let autoLastX = 0;
  let autoLastY = 0;
  let autoGoal = null;
  let autoVisit = new Uint8Array(COLS * ROWS);
  let autoVisitN = 0;
  let autoSeen = null;
  let autoPrev = null;
  let autoQueue = null;
  let autoNudgeD = 0;
  const particles = [];
  const pops = [];
  const motes = [];
  const lasers = [];
  const rings = [];
  const slashes = [];

  const G = {
    mode: 'title',
    kind: 'clear',
    t: 0,
    clock: 0,
    stage: 0,
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
    player: { x: 2.5, y: 5.5, fx: 1, fy: 0, walk: 0, fireCd: 0, meleeCd: 0, meleeI: 0 },
    startC: 2,
    startR: 5,
    exitC: 14,
    exitR: 5,
    spawnInt: 2.2,
    drain: 3.8,
    genHp: 4,
    startGens: 0,
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

  function playHint() {
    if (autoOn) return '托管中 · A 停下';
    if (G.kind === 'horde') return '尸潮层 · 发生器更密 · 生命掉得更快';
    return '斩发生器 · 抢食物 · 出口随时可进';
  }

  function playHintKind() {
    if (autoOn) return 'hot';
    if (G.kind === 'horde') return 'warn';
    return '';
  }

  function syncModes() {
    if (modeClear) modeClear.setAttribute('aria-pressed', G.kind === 'clear' ? 'true' : 'false');
    if (modeHorde) modeHorde.setAttribute('aria-pressed', G.kind === 'horde' ? 'true' : 'false');
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

  function liveWraiths() {
    let n = 0;
    for (let i = 0; i < G.mons.length; i++) {
      if (G.mons[i].alive && G.mons[i].kind === 'wraith') n += 1;
    }
    return n;
  }

  function playerShots() {
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) if (G.shots[i].from === 'p') n += 1;
    return n;
  }

  function modeName() {
    return G.kind === 'horde' ? '尸潮' : '清廊';
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && G.comboT > 0);
    const hpShow = Math.max(0, Math.ceil(G.hp));
    if (hpEl) hpEl.textContent = String(hpShow);
    if (hpFill) hpFill.style.transform = 'scaleX(' + clamp(G.hp / HP_MAX, 0, 1) + ')';
    if (hpBox) hpBox.classList.toggle('low', G.hp > 0 && G.hp < HP_LOW);
    if (stageLabel) {
      const st = FLOORS[Math.min(G.stage, FLOORS.length - 1)];
      stageLabel.textContent = G.mode === 'title'
        ? modeName()
        : (modeName() + ' ' + (G.stage + 1) + '/' + FLOORS.length + ' · ' + st.name);
      stageLabel.classList.toggle('hot', G.combo >= 3);
    }
    if (tagLabel) {
      if (G.hp > 0 && G.hp < HP_LOW && G.mode === 'play') {
        tagLabel.textContent = '生命将尽';
        tagLabel.className = 'warn';
      } else if (liveWraiths() > 0 && G.mode === 'play') {
        tagLabel.textContent = '影须近斩';
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
      if (ovKicker) ovKicker.textContent = 'GAUN';
      if (ovTitle) ovTitle.textContent = '地牢';
      if (ovLead) ovLead.innerHTML = '四向跑迷宫。空格射弹，贴身挥剑砸发生器。<br />生命一直在掉，食物回血。出口随时可进，别磨太久。';
      if (ovOps) ovOps.textContent = OPS;
    } else if (kind === 'win') {
      if (ovKicker) ovKicker.textContent = 'CLEAR';
      if (ovTitle) ovTitle.textContent = G.kind === 'horde' ? '尸潮退了' : '廊清了';
      if (ovLead) ovLead.textContent = '六层都跑出来了。分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '');
      if (ovOps) ovOps.textContent = 'R 重开随时可用';
      if (ovAgain) ovAgain.textContent = '再来一轮';
      if (ovMenu) ovMenu.textContent = '换模式';
    } else {
      if (ovKicker) ovKicker.textContent = 'DOWN';
      if (ovTitle) ovTitle.textContent = G.why || '命尽了';
      if (ovLead) ovLead.textContent = '停在第 ' + (G.stage + 1) + ' 层。分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '');
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
    if (autoOn && autoSpeed >= 4) return;
    G.stop = Math.max(G.stop, sec);
  }

  function screenFlash(rgb, a) {
    G.flash = a;
    G.flashRgb = rgb;
  }

  function emit(n, spec) {
    if (REDUCE) n = Math.min(n, 6);
    if (particles.length > 140) n = Math.min(n, 4);
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

  function spawnSlash(x, y, fx, fy) {
    slashes.push({ x: x, y: y, fx: fx, fy: fy, t: 0.16, life: 0.16 });
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
    lasers.length = 0;
    rings.length = 0;
    slashes.length = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
  }

  function typeRgb(kind) {
    if (kind === 'wraith') return PUR;
    if (kind === 'zombie') return ZOM;
    return BONE;
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
    const md = minD || 2.2;
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
      const p = takeCell(cells, rng, px, py, 2.0);
      if (!p) break;
      G.grid[idx(p.c, p.r)] = FOOD;
    }
    n = spec.loot;
    while (n-- > 0) {
      const p = takeCell(cells, rng, px, py, 2.2);
      if (!p) break;
      G.grid[idx(p.c, p.r)] = LOOT;
    }
  }

  function placeGens(spec, seen, rng, px, py) {
    G.gens = [];
    const types = [];
    for (let i = 0; i < spec.bone; i++) types.push('bone');
    for (let i = 0; i < spec.zombie; i++) types.push('zombie');
    for (let i = 0; i < spec.wraith; i++) types.push('wraith');
    while (types.length < spec.gens) types.push('bone');
    for (let i = types.length - 1; i > 0; i--) {
      const j = (rng() * (i + 1)) | 0;
      const tmp = types[i];
      types[i] = types[j];
      types[j] = tmp;
    }
    const cells = openCells(seen);
    const n = Math.min(spec.gens, types.length);
    for (let i = 0; i < n; i++) {
      const p = takeCell(cells, rng, px, py, 3.2);
      if (!p) break;
      const kind = types[i];
      G.gens.push({
        x: p.c + 0.5,
        y: p.r + 0.5,
        kind: kind,
        hp: spec.hp,
        maxHp: spec.hp,
        cd: rand(0.3, spec.spawn * 0.7),
        kids: 0,
        rgb: typeRgb(kind),
        alive: true,
        pulse: rng() * TAU
      });
    }
    if (G.gens.length === 0) {
      const p = takeCell(openCells(seen), rng, px, py, 2.4);
      if (p) {
        G.gens.push({
          x: p.c + 0.5,
          y: p.r + 0.5,
          kind: 'bone',
          hp: spec.hp,
          maxHp: spec.hp,
          cd: rand(0.3, 0.8),
          kids: 0,
          rgb: typeRgb('bone'),
          alive: true,
          pulse: rng() * TAU
        });
      }
    }
    G.startGens = G.gens.length;
  }

  function spawnMon(kind, x, y, parent) {
    const cap = G.kind === 'horde' ? MAX_MON_HORDE : MAX_MON;
    if (liveMons() >= cap) return null;
    const t = TYPE[kind] || TYPE.bone;
    const face = snap4(G.player.x - x, G.player.y - y);
    const mon = {
      x: x,
      y: y,
      fx: face[0],
      fy: face[1],
      kind: kind,
      r: t.r,
      hp: t.hp,
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
      const n = 1 + (rng() < 0.4 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        const ang = (rng() * 4) | 0;
        const x = g.x + DX[ang] * (0.85 + rng() * 0.3);
        const y = g.y + DY[ang] * (0.85 + rng() * 0.3);
        if (blocked(x, y, tR(g.kind))) continue;
        if (hypot(x - G.player.x, y - G.player.y) < 2.8) continue;
        spawnMon(g.kind, x, y, g);
      }
    }
  }

  function tR(kind) {
    return (TYPE[kind] || TYPE.bone).r;
  }

  function buildFloor() {
    const spec = specNow();
    const seed0 = G.floorId * 7919 + (G.kind === 'horde' ? 41 : 7) + G.stage * 29;
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
    G.player.meleeCd = 0;
    G.player.meleeI = 0;
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
    G.ready = 0.34;
    G.invuln = 0.46;
    G.hurtCd = 0;
    resetFx();
    autoResetPlan();
  }

  function startGame(kind) {
    G.kind = kind === 'horde' ? 'horde' : 'clear';
    G.mode = 'play';
    G.stage = 0;
    G.floorId = 1;
    G.hp = HP_START;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.deadT = 0;
    G.why = '';
    G.lowWarned = false;
    buildFloor();
    hideOverlay();
    audio.start();
    const spec = specNow();
    toast(G.kind === 'horde' ? '尸潮 · 更密更快' : ('清廊 · ' + spec.name), G.kind === 'horde', G.kind !== 'horde');
    setHint(playHint(), playHintKind());
    syncHud();
  }

  function startClear() { startGame('clear'); }
  function startHorde() { startGame('horde'); }

  function bootTitle() {
    G.mode = 'title';
    G.kind = 'clear';
    G.stage = 0;
    G.floorId = 1;
    G.hp = HP_START;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    buildFloor();
    G.invuln = 99;
    showOverlay('title');
    setHint(autoOn ? '托管中 · A 停下' : '四向走 · 空格射击 · 贴身斩发生器 · A 自动 · 生命一直掉 · 出口随时可进', autoOn ? 'hot' : '');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') {
      startClear();
      return;
    }
    startGame(G.kind);
  }

  function winRun() {
    if (G.mode !== 'play') return;
    const bonus = Math.ceil(G.hp) * 8;
    if (bonus > 0) addScore(bonus, G.player.x, G.player.y);
    G.mode = 'win';
    audio.win();
    kick('win-flash');
    screenFlash(GOLD, 0.45);
    hitStop(0.08);
    showOverlay('win');
    setHint(autoOn ? '托管中 · A 停下' : ((G.kind === 'horde' ? '尸潮退了' : '廊清了') + ' · R 再来'), 'hot');
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
    setHint(autoOn ? '托管中 · R 重开接着打' : 'R 重开随时可用', 'warn');
    syncHud();
  }

  function hurtPlayer(n, why) {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0 || G.player.meleeI > 0) return;
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
    const t = TYPE[mon.kind] || TYPE.bone;
    bumpCombo();
    addScore(t.score * G.mult, mon.x, mon.y);
    hitStop(0.05 + Math.min(0.03, G.combo * 0.005));
    G.shake = Math.max(G.shake, 4 + Math.min(4, G.combo));
    G.punch = 0.972;
    kick('boom');
  }

  function hitMon(mon, dmg, melee) {
    if (!mon.alive) return;
    const t = TYPE[mon.kind] || TYPE.bone;
    if (t.immune && !melee) {
      audio.clang();
      spawnPop(mon.x, mon.y - 0.25, '穿不透', PUR);
      emit(5, {
        x: mon.x, y: mon.y, j: 0.08,
        vx0: -2, vx1: 2, vy0: -3, vy1: 1,
        life: 0.18, r0: 0.02, r1: 0.06, rgb: PUR, g: 0
      });
      return;
    }
    mon.hp -= dmg;
    if (mon.hp <= 0) killMon(mon);
    else {
      audio.wall();
      emit(6, {
        x: mon.x, y: mon.y, j: 0.08,
        vx0: -3, vx1: 3, vy0: -4, vy1: 2,
        life: 0.18, r0: 0.03, r1: 0.07, rgb: mon.rgb, g: 2
      });
      hitStop(0.032);
    }
  }

  function checkClear() {
    if (G.cleared || G.mode !== 'play') return;
    if (liveGens() > 0) return;
    G.cleared = true;
    const bonus = 120 + 24 * G.startGens;
    addScore(bonus, G.player.x, G.player.y - 0.55);
    toast('发生器清光 · 出口镀金', false, true);
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
      addScore(180 * G.mult, gen.x, gen.y);
      hitStop(0.068);
      G.shake = Math.max(G.shake, 8);
      G.punch = 0.955;
      kick('boom');
      screenFlash(gen.rgb, 0.28);
      if (Math.random() < 0.34) {
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
      hitStop(0.032);
      G.punch = 0.985;
    }
  }

  function destroyPickup(c, r, shot) {
    const t = G.grid[idx(c, r)];
    G.grid[idx(c, r)] = EMPTY;
    audio.waste();
    const rgb = t === FOOD ? GRN : GOLD;
    emit(8, {
      x: c + 0.5, y: r + 0.5, j: 0.08,
      vx0: -3, vx1: 3, vy0: -4, vy1: 2,
      life: 0.22, r0: 0.03, r1: 0.08, rgb: rgb, g: 3
    });
    spawnPop(c + 0.5, r + 0.35, '毁了', MAG);
    if (shot) shot.dead = true;
  }

  function grabCell(c, r) {
    if (!inb(c, r)) return;
    const t = G.grid[idx(c, r)];
    if (t !== FOOD && t !== LOOT) return;
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
    } else {
      audio.loot();
      bumpCombo();
      addScore(100 * G.mult, x, y);
      emit(12, {
        x: x, y: y, j: 0.12,
        vx0: -4, vx1: 4, vy0: -6, vy1: 1,
        life: 0.36, r0: 0.03, r1: 0.09, rgb: GOLD, g: 3
      });
      spawnRing(x, y, GOLD);
    }
    G.punch = 0.978;
  }

  function nextFloor() {
    addScore(50, G.player.x, G.player.y);
    audio.exit();
    if (G.stage >= FLOORS.length - 1) {
      winRun();
      return;
    }
    G.stage += 1;
    G.floorId += 1;
    G.comboT = Math.max(G.comboT, 0.55);
    buildFloor();
    const spec = specNow();
    toast(spec.name + ' · 第 ' + (G.stage + 1) + ' 层', false, true);
    kick('win-flash');
    screenFlash(CYN, 0.28);
    syncHud();
  }

  function firePlayer(dx, dy) {
    if (G.mode !== 'play' || G.deadT > 0 || G.ready > 0) return;
    if (G.player.fireCd > 0) return;
    if (playerShots() >= MAX_SHOTS) return;
    const s = snap4(dx, dy);
    G.player.fx = s[0];
    G.player.fy = s[1];
    G.shots.push({
      x: G.player.x + s[0] * 0.4,
      y: G.player.y + s[1] * 0.4,
      vx: s[0] * P_SHOT,
      vy: s[1] * P_SHOT,
      from: 'p',
      dmg: 1,
      rgb: HOT2,
      dead: false
    });
    G.player.fireCd = FIRE_CD;
    audio.zap();
    screenFlash(HOT, 0.1);
    G.punch = 0.986;
    lasers.push({
      x: G.player.x,
      y: G.player.y,
      ux: s[0],
      uy: s[1],
      t: 0.08,
      rgb: HOT
    });
    emit(5, {
      x: G.player.x + s[0] * 0.38, y: G.player.y + s[1] * 0.38, j: 0.04,
      vx0: s[0] * 2, vx1: s[0] * 6, vy0: s[1] * 2, vy1: s[1] * 6,
      life: 0.14, r0: 0.03, r1: 0.07, rgb: HOT, g: 0
    });
  }

  function inMeleeCone(tx, ty) {
    const dx = tx - G.player.x;
    const dy = ty - G.player.y;
    const dist = hypot(dx, dy);
    if (dist < 0.46) return true;
    if (dist > MELEE_R) return false;
    const dot = dx * G.player.fx + dy * G.player.fy;
    return dot > dist * 0.22;
  }

  function tryMelee() {
    if (G.mode !== 'play' || G.deadT > 0 || G.ready > 0) return;
    if (G.player.meleeCd > 0) return;
    let best = null;
    let bestD = 99;
    let isGen = false;
    for (let i = 0; i < G.mons.length; i++) {
      const m = G.mons[i];
      if (!m.alive) continue;
      if (!inMeleeCone(m.x, m.y)) continue;
      const d = hypot(m.x - G.player.x, m.y - G.player.y);
      if (d < bestD) {
        bestD = d;
        best = m;
        isGen = false;
      }
    }
    for (let i = 0; i < G.gens.length; i++) {
      const g = G.gens[i];
      if (!g.alive) continue;
      if (!inMeleeCone(g.x, g.y)) continue;
      const d = hypot(g.x - G.player.x, g.y - G.player.y);
      if (d < bestD) {
        bestD = d;
        best = g;
        isGen = true;
      }
    }
    if (!best) return;
    G.player.meleeCd = MELEE_CD;
    G.player.meleeI = 0.14;
    audio.slash();
    spawnSlash(G.player.x, G.player.y, G.player.fx, G.player.fy);
    kick('slash');
    hitStop(isGen ? 0.072 : 0.052);
    G.shake = Math.max(G.shake, isGen ? 6 : 4);
    G.punch = 0.968;
    screenFlash(GOLD, 0.18);
    emit(10, {
      x: best.x, y: best.y, j: 0.1,
      vx0: -5, vx1: 5, vy0: -6, vy1: 3,
      life: 0.28, r0: 0.03, r1: 0.09, rgb: GOLD, g: 4
    });
    if (isGen) hitGen(best, MELEE_DMG);
    else hitMon(best, MELEE_DMG, true);
  }

  function tryMove(ent, dx, dy, rad) {
    const nx = ent.x + dx;
    const ny = ent.y + dy;
    if (dx && !blocked(nx, ent.y, rad)) ent.x = nx;
    if (dy && !blocked(ent.x, ny, rad)) ent.y = ny;
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

  function autoEnsureBuf() {
    const n = COLS * ROWS;
    if (!autoSeen || autoSeen.length !== n) {
      autoSeen = new Int16Array(n);
      autoPrev = new Int16Array(n);
      autoQueue = new Int16Array(n);
    }
  }

  function autoResetPlan() {
    autoWish.x = 0;
    autoWish.y = 0;
    autoGoal = null;
    autoStuck = 0;
    autoLastX = G.player.x;
    autoLastY = G.player.y;
    autoVisit = new Uint8Array(COLS * ROWS);
    autoVisitN = 0;
    autoNudgeD = (autoNudgeD + 1) & 3;
    if (autoOn) fireHold = false;
  }

  function autoWalkable(c, r, allowC, allowR) {
    if (!inb(c, r)) return false;
    if (G.grid[idx(c, r)] === WALL) return false;
    if (allowC === c && allowR === r) return true;
    if (genAt(c, r)) return false;
    return true;
  }

  function autoPathTo(sc, sr, tc, tr) {
    if (!inb(sc, sr) || !inb(tc, tr)) return null;
    if (sc === tc && sr === tr) return [];
    if (!autoWalkable(tc, tr, tc, tr)) return null;
    autoEnsureBuf();
    autoSeen.fill(0);
    autoPrev.fill(-1);
    let qh = 0;
    let qt = 0;
    const sid = idx(sc, sr);
    autoQueue[qt++] = sid;
    autoSeen[sid] = 1;
    let found = -1;
    while (qh < qt) {
      const id = autoQueue[qh++];
      const c = id % COLS;
      const r = (id / COLS) | 0;
      if (c === tc && r === tr) {
        found = id;
        break;
      }
      for (let d = 0; d < 4; d++) {
        const nc = c + DX[d];
        const nr = r + DY[d];
        if (!inb(nc, nr)) continue;
        const nid = idx(nc, nr);
        if (autoSeen[nid]) continue;
        if (!autoWalkable(nc, nr, tc, tr)) continue;
        autoSeen[nid] = 1;
        autoPrev[nid] = id;
        autoQueue[qt++] = nid;
      }
    }
    if (found < 0) return null;
    const path = [];
    let cur = found;
    let guard = 0;
    while (cur !== sid && cur >= 0 && guard++ < COLS * ROWS) {
      path.push({ c: cur % COLS, r: (cur / COLS) | 0 });
      cur = autoPrev[cur];
    }
    path.reverse();
    return path;
  }

  function autoNearestUnvisited(sc, sr) {
    autoEnsureBuf();
    autoSeen.fill(0);
    autoPrev.fill(-1);
    let qh = 0;
    let qt = 0;
    const sid = idx(sc, sr);
    autoQueue[qt++] = sid;
    autoSeen[sid] = 1;
    while (qh < qt) {
      const id = autoQueue[qh++];
      const c = id % COLS;
      const r = (id / COLS) | 0;
      if (!(c === sc && r === sr) && !autoVisit[id] && autoWalkable(c, r, c, r)) {
        const path = [];
        let cur = id;
        let guard = 0;
        while (cur !== sid && cur >= 0 && guard++ < COLS * ROWS) {
          path.push({ c: cur % COLS, r: (cur / COLS) | 0 });
          cur = autoPrev[cur];
        }
        path.reverse();
        return { c: c, r: r, path: path, kind: 'explore' };
      }
      for (let d = 0; d < 4; d++) {
        const nc = c + DX[d];
        const nr = r + DY[d];
        if (!inb(nc, nr)) continue;
        const nid = idx(nc, nr);
        if (autoSeen[nid]) continue;
        if (!autoWalkable(nc, nr, nc, nr)) continue;
        autoSeen[nid] = 1;
        autoPrev[nid] = id;
        autoQueue[qt++] = nid;
      }
    }
    return null;
  }

  function autoArrived(c, r) {
    return Math.abs(G.player.x - (c + 0.5)) < 0.22 && Math.abs(G.player.y - (r + 0.5)) < 0.22;
  }

  function autoFollow(path) {
    if (!path || !path.length) {
      autoWish.x = 0;
      autoWish.y = 0;
      return true;
    }
    while (path.length) {
      const w = path[0];
      const tx = w.c + 0.5;
      const ty = w.r + 0.5;
      const dx = G.player.x - tx;
      const dy = G.player.y - ty;
      if (dx * dx + dy * dy < 0.18) {
        path.shift();
        continue;
      }
      if (path.length > 1) {
        const n = path[1];
        const nx = n.c + 0.5;
        const ny = n.r + 0.5;
        if (hypot(G.player.x - nx, G.player.y - ny) + 0.04 <= hypot(tx - nx, ty - ny)) {
          path.shift();
          continue;
        }
      }
      break;
    }
    if (!path.length) {
      autoWish.x = 0;
      autoWish.y = 0;
      return true;
    }
    const w = path[0];
    const tx = w.c + 0.5;
    const ty = w.r + 0.5;
    const dx = tx - G.player.x;
    const dy = ty - G.player.y;
    const pc = G.player.x | 0;
    const pr = G.player.y | 0;
    if (Math.abs(dx) > 0.08 && Math.abs(dy) > 0.08) {
      const cx = pc + 0.5 - G.player.x;
      const cy = pr + 0.5 - G.player.y;
      if (Math.abs(cx) > 0.12 && w.c !== pc) {
        autoWish.x = cx > 0 ? 1 : -1;
        autoWish.y = 0;
      } else if (Math.abs(cy) > 0.12 && w.r !== pr) {
        autoWish.x = 0;
        autoWish.y = cy > 0 ? 1 : -1;
      } else if (Math.abs(dx) >= Math.abs(dy)) {
        autoWish.x = dx > 0 ? 1 : -1;
        autoWish.y = 0;
      } else {
        autoWish.x = 0;
        autoWish.y = dy > 0 ? 1 : -1;
      }
    } else if (Math.abs(dx) >= Math.abs(dy)) {
      autoWish.x = dx > 0 ? 1 : dx < 0 ? -1 : 0;
      autoWish.y = 0;
    } else {
      autoWish.x = 0;
      autoWish.y = dy > 0 ? 1 : dy < 0 ? -1 : 0;
    }
    return false;
  }

  function autoRay(px, py, dx, dy) {
    if (!dx && !dy) return null;
    let x = px + dx * 0.32;
    let y = py + dy * 0.32;
    for (let i = 0; i < 18; i++) {
      x += dx * 0.45;
      y += dy * 0.45;
      const t = cellAt(x, y);
      if (t === WALL) return { kind: 'wall', dist: i };
      if (t === FOOD) return { kind: 'food', dist: i, c: x | 0, r: y | 0 };
      if (t === LOOT) return { kind: 'loot', dist: i, c: x | 0, r: y | 0 };
      for (let g = 0; g < G.gens.length; g++) {
        const gen = G.gens[g];
        if (!gen.alive) continue;
        if (hypot(x - gen.x, y - gen.y) < G_R + 0.14) return { kind: 'gen', dist: i, gen: gen };
      }
      for (let m = 0; m < G.mons.length; m++) {
        const mon = G.mons[m];
        if (!mon.alive) continue;
        if (hypot(x - mon.x, y - mon.y) < mon.r + 0.14) return { kind: 'mon', dist: i, mon: mon };
      }
    }
    return { kind: 'none', dist: 18 };
  }

  function autoPickShot() {
    let best = null;
    for (let d = 0; d < 4; d++) {
      const dx = DX[d];
      const dy = DY[d];
      const ray = autoRay(G.player.x, G.player.y, dx, dy);
      if (!ray) continue;
      if (ray.kind === 'food' || ray.kind === 'loot' || ray.kind === 'wall' || ray.kind === 'none') continue;
      if (ray.kind === 'mon' && ray.mon.kind === 'wraith') continue;
      const score = (ray.kind === 'gen' ? 22 : 16) - ray.dist;
      if (!best || score > best.score) {
        best = { dx: dx, dy: dy, dist: ray.dist, kind: ray.kind, shoot: true, score: score };
      }
    }
    return best;
  }

  function autoClosestFoe() {
    let best = null;
    let bestD = 99;
    let kind = '';
    for (let i = 0; i < G.mons.length; i++) {
      const m = G.mons[i];
      if (!m.alive) continue;
      const d = hypot(m.x - G.player.x, m.y - G.player.y);
      const w = m.kind === 'wraith' ? d - 0.15 : d;
      if (w < bestD) {
        bestD = w;
        best = m;
        kind = 'mon';
      }
    }
    for (let i = 0; i < G.gens.length; i++) {
      const g = G.gens[i];
      if (!g.alive) continue;
      const d = hypot(g.x - G.player.x, g.y - G.player.y);
      if (d < bestD) {
        bestD = d;
        best = g;
        kind = 'gen';
      }
    }
    return best ? { ent: best, d: hypot(best.x - G.player.x, best.y - G.player.y), kind: kind } : null;
  }

  function autoThreatClose() {
    let n = 0;
    let near = null;
    let nd = 99;
    for (let i = 0; i < G.mons.length; i++) {
      const m = G.mons[i];
      if (!m.alive) continue;
      const d = hypot(m.x - G.player.x, m.y - G.player.y);
      if (d < 1.65) n += 1;
      if (d < nd) {
        nd = d;
        near = m;
      }
    }
    return { n: n, mon: near, d: nd };
  }

  function autoGenStand(pc, pr, gen) {
    const gc = gen.x | 0;
    const gr = gen.y | 0;
    let best = null;
    let bestD = 99;
    for (let d = 0; d < 4; d++) {
      const c = gc + DX[d];
      const r = gr + DY[d];
      if (!autoWalkable(c, r, c, r)) continue;
      const path = autoPathTo(pc, pr, c, r);
      if (!path) continue;
      if (path.length < bestD) {
        bestD = path.length;
        best = { c: c, r: r, path: path, kind: 'gen', gx: gen.x, gy: gen.y };
      }
    }
    return best;
  }

  function autoCountFood() {
    let n = 0;
    for (let i = 0; i < G.grid.length; i++) if (G.grid[i] === FOOD) n += 1;
    return n;
  }

  function autoGoalAlive(goal) {
    if (!goal) return false;
    if (goal.kind === 'food') return G.grid[idx(goal.c, goal.r)] === FOOD;
    if (goal.kind === 'loot') return G.grid[idx(goal.c, goal.r)] === LOOT;
    if (goal.kind === 'exit') return G.grid[idx(goal.c, goal.r)] === EXIT;
    if (goal.kind === 'gen') {
      for (let i = 0; i < G.gens.length; i++) {
        if (G.gens[i].alive && hypot(G.gens[i].x - goal.gx, G.gens[i].y - goal.gy) < 0.4) return true;
      }
      return false;
    }
    if (goal.kind === 'mon') {
      for (let i = 0; i < G.mons.length; i++) {
        if (G.mons[i].alive && hypot(G.mons[i].x - (goal.c + 0.5), G.mons[i].y - (goal.r + 0.5)) < 1.4) return true;
      }
      return false;
    }
    if (goal.kind === 'explore') return !autoVisit[idx(goal.c, goal.r)];
    return true;
  }

  function autoPickGoal(pc, pr) {
    const hp = G.hp;
    const foods = autoCountFood();
    const cands = [];
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        const t = G.grid[idx(c, r)];
        if (t === FOOD) {
          let score = 90;
          if (hp < HP_LOW) score = 520;
          else if (hp < 55) score = 360;
          else if (hp < 85) score = 220;
          else if (hp < 110) score = 130;
          cands.push({ c: c, r: r, kind: 'food', score: score, w: hp < 70 ? 4 : 7 });
        } else if (t === LOOT && hp > 42) {
          cands.push({ c: c, r: r, kind: 'loot', score: 95, w: 8 });
        } else if (t === EXIT) {
          let score = 18;
          if (G.cleared) score = 260;
          else if (hp < 32 && foods === 0) score = 480;
          else if (hp < 40 && foods === 0) score = 300;
          else if (liveGens() === 0) score = 240;
          cands.push({ c: c, r: r, kind: 'exit', score: score, w: 5 });
        }
      }
    }
    for (let i = 0; i < G.gens.length; i++) {
      const g = G.gens[i];
      if (!g.alive) continue;
      const stand = autoGenStand(pc, pr, g);
      if (stand) {
        stand.score = (hp < HP_LOW ? 140 : 300) - stand.path.length * 5;
        stand.w = 0;
        cands.push(stand);
      }
    }
    const threat = autoThreatClose();
    if (threat.mon && threat.d < 2.4 && (threat.mon.kind === 'wraith' || hp > 38)) {
      const tc = threat.mon.x | 0;
      const tr = threat.mon.y | 0;
      if (autoWalkable(tc, tr, tc, tr) || (tc === pc && tr === pr)) {
        const path = autoPathTo(pc, pr, tc, tr) || [];
        cands.push({
          c: tc,
          r: tr,
          kind: 'mon',
          path: path,
          score: threat.mon.kind === 'wraith' ? 340 : 160,
          w: 0
        });
      }
    }

    let best = null;
    let bestS = -1e9;
    for (let i = 0; i < cands.length; i++) {
      const t = cands[i];
      const path = t.path || autoPathTo(pc, pr, t.c, t.r);
      if (!path && !(t.c === pc && t.r === pr)) continue;
      const usePath = path || [];
      const s = t.score - usePath.length * (t.w || 6);
      if (s > bestS) {
        bestS = s;
        best = {
          c: t.c,
          r: t.r,
          path: usePath,
          kind: t.kind,
          gx: t.gx,
          gy: t.gy
        };
      }
    }
    if (best && bestS > 12) return best;
    const explore = autoNearestUnvisited(pc, pr);
    if (explore && liveGens() > 0) return explore;
    if (best) return best;
    return autoPathTo(pc, pr, G.exitC, G.exitR)
      ? { c: G.exitC, r: G.exitR, path: autoPathTo(pc, pr, G.exitC, G.exitR), kind: 'exit' }
      : null;
  }

  function autoFaceToward(x, y) {
    const s = snap4(x - G.player.x, y - G.player.y);
    autoWish.x = s[0];
    autoWish.y = s[1];
  }

  function autoCanStep(dx, dy) {
    if (!dx && !dy) return false;
    const nx = G.player.x + dx * 0.38;
    const ny = G.player.y + dy * 0.38;
    if (dx && !blocked(nx, G.player.y, P_R) && !genBlocked(nx, G.player.y, P_R, null)) return true;
    if (dy && !blocked(G.player.x, ny, P_R) && !genBlocked(G.player.x, ny, P_R, null)) return true;
    return false;
  }

  function autoNudge() {
    const pc = G.player.x | 0;
    const pr = G.player.y | 0;
    for (let k = 0; k < 4; k++) {
      const d = (autoNudgeD + k) & 3;
      const nc = pc + DX[d];
      const nr = pr + DY[d];
      if (!autoWalkable(nc, nr, nc, nr)) continue;
      autoWish.x = DX[d];
      autoWish.y = DY[d];
      autoNudgeD = (d + 1) & 3;
      return;
    }
    autoWish.x = DX[autoNudgeD];
    autoWish.y = DY[autoNudgeD];
    autoNudgeD = (autoNudgeD + 1) & 3;
  }

  function autoSetFire(dx, dy) {
    const ray = autoRay(G.player.x, G.player.y, dx, dy);
    fireHold = !!(ray && (ray.kind === 'gen' || (ray.kind === 'mon' && ray.mon.kind !== 'wraith')));
  }

  function autoThink(dt) {
    if (G.deadT > 0 || G.ready > 0) {
      autoWish.x = 0;
      autoWish.y = 0;
      fireHold = false;
      return;
    }
    const p = G.player;
    const pc = p.x | 0;
    const pr = p.y | 0;
    const moved = Math.abs(p.x - autoLastX) + Math.abs(p.y - autoLastY);
    if (moved < 0.028) autoStuck += dt;
    else autoStuck = 0;
    autoLastX = p.x;
    autoLastY = p.y;
    const vid = idx(pc, pr);
    if (!autoVisit[vid]) {
      autoVisit[vid] = 1;
      autoVisitN += 1;
    }

    const foe = autoClosestFoe();
    if (foe && foe.d < 0.74) {
      autoFaceToward(foe.ent.x, foe.ent.y);
      if (foe.kind === 'mon' && foe.ent.kind === 'wraith') fireHold = false;
      else autoSetFire(autoWish.x, autoWish.y);
      return;
    }
    if (foe && foe.d < 1.18) {
      autoFaceToward(foe.ent.x, foe.ent.y);
      if (autoCanStep(autoWish.x, autoWish.y)) {
        if (foe.kind === 'mon' && foe.ent.kind === 'wraith') fireHold = false;
        else autoSetFire(autoWish.x, autoWish.y);
        return;
      }
    }

    const foodCrisis = G.hp < 40 && autoCountFood() > 0;
    const shot = autoPickShot();
    if (shot && !foodCrisis && shot.dist <= 2.2 && autoCanStep(shot.dx, shot.dy)) {
      if (!autoGoal || autoGoal.kind === 'gen' || autoGoal.kind === 'mon') {
        autoWish.x = shot.dx;
        autoWish.y = shot.dy;
        fireHold = true;
        if (shot.dist <= 1.4) return;
      }
    }

    if (autoStuck > 0.4) {
      autoGoal = null;
      autoStuck = 0;
      autoNudge();
      autoSetFire(autoWish.x || p.fx, autoWish.y || p.fy);
      return;
    }

    if (!autoGoal || !autoGoalAlive(autoGoal)) autoGoal = autoPickGoal(pc, pr);
    if (autoGoal && autoGoal.kind === 'gen' && autoGoal.gx != null) {
      const gd = hypot(autoGoal.gx - p.x, autoGoal.gy - p.y);
      if (gd < 1.2) {
        autoFaceToward(autoGoal.gx, autoGoal.gy);
        fireHold = true;
        return;
      }
    }
    if (autoGoal && autoGoal.path) {
      if (autoFollow(autoGoal.path)) autoGoal = null;
    } else if (autoGoal) {
      autoFaceToward(autoGoal.c + 0.5, autoGoal.r + 0.5);
    } else {
      autoWish.x = 0;
      autoWish.y = 0;
    }
    autoSetFire(autoWish.x || p.fx, autoWish.y || p.fy);
  }

  function loadAutoSpeed() {
    try {
      const n = parseInt(localStorage.getItem(AUTO_SPEED_KEY) || '3', 10);
      if (n >= 1 && n <= 4) return n;
    } catch (err) { /* ignore */ }
    return 3;
  }

  function saveAutoSpeed(n) {
    try {
      localStorage.setItem(AUTO_SPEED_KEY, String(n));
    } catch (err) { /* ignore */ }
  }

  function syncAutoUi() {
    if (!btnAuto) return;
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.textContent = autoOn ? '停下' : '自动';
    btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
  }

  function syncSpeedUi() {
    if (!speedEl || !speedLab) return;
    speedEl.value = String(autoSpeed);
    speedLab.textContent = AUTO_SPEED_NAME[autoSpeed];
    speedEl.title = AUTO_SPEED_NAME[autoSpeed];
    speedEl.setAttribute('aria-valuetext', AUTO_SPEED_NAME[autoSpeed]);
  }

  function setAutoSpeed(n) {
    n = parseInt(n, 10);
    if (!isFinite(n) || n < 1 || n > 4) n = 3;
    autoSpeed = n;
    saveAutoSpeed(autoSpeed);
    syncSpeedUi();
  }

  function clearAutoInput() {
    keys.u = keys.d = keys.l = keys.r = false;
    fireHold = false;
    ptr.down = false;
    ptr.dragging = false;
    ptr.dx = 0;
    ptr.dy = 0;
    autoWish.x = 0;
    autoWish.y = 0;
  }

  function toggleAuto() {
    autoOn = !autoOn;
    autoResetPlan();
    autoOvWait = 0;
    clearAutoInput();
    syncAutoUi();
    audio.ensure();
    if (autoOn) {
      if (G.mode === 'title') startGame(G.kind === 'horde' ? 'horde' : 'clear');
      else if (G.mode === 'win' || G.mode === 'lose') restart();
      else if (G.mode === 'play') setHint('托管中 · A 停下', 'hot');
    } else if (G.mode === 'play') {
      setHint(playHint(), playHintKind());
    } else if (G.mode === 'title') {
      setHint('四向走 · 空格射击 · 贴身斩发生器 · A 自动 · 生命一直掉 · 出口随时可进');
    }
  }

  function tickAuto(dt) {
    if (!autoOn) return;
    if (G.mode === 'title') {
      autoOvWait += dt;
      if (autoOvWait >= (AUTO_OV_WAIT[autoSpeed] || 0.4)) {
        autoOvWait = 0;
        startGame(G.kind === 'horde' ? 'horde' : 'clear');
      }
      return;
    }
    if (G.mode === 'win' || G.mode === 'lose') {
      autoOvWait += dt;
      if (autoOvWait >= (AUTO_OV_WAIT[autoSpeed] || 0.4)) {
        autoOvWait = 0;
        restart();
      }
      return;
    }
    autoOvWait = 0;
    if (G.mode !== 'play' || G.deadT > 0) {
      autoWish.x = 0;
      autoWish.y = 0;
      fireHold = false;
      return;
    }
    if (G.stop > 0) return;
    autoThink(dt);
  }

  function autoScale() {
    if (!autoOn || G.mode !== 'play') return 1;
    return AUTO_TIME[autoSpeed] || 1;
  }

  function playerDir() {
    if (autoOn && G.mode === 'play') {
      return { mx: autoWish.x, my: autoWish.y };
    }
    let mx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
    let my = (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
    if (ptr.dragging) {
      const s = snap4(ptr.dx, ptr.dy);
      mx = s[0];
      my = s[1];
    } else if (mx && my) {
      if (lastAxis === 0) my = 0;
      else mx = 0;
    }
    return { mx: mx, my: my };
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    G.player.fireCd = Math.max(0, G.player.fireCd - dt);
    G.player.meleeCd = Math.max(0, G.player.meleeCd - dt);
    G.player.meleeI = Math.max(0, G.player.meleeI - dt);
    const dir = playerDir();
    let mx = dir.mx;
    let my = dir.my;
    if (mx || my) {
      const s = snap4(mx, my);
      mx = s[0];
      my = s[1];
      G.player.fx = s[0];
      G.player.fy = s[1];
      G.player.walk += dt * 14;
      const ox0 = G.player.x;
      const oy0 = G.player.y;
      tryMove(G.player, mx * P_SPD * dt, my * P_SPD * dt, P_R);
      if (genBlocked(G.player.x, G.player.y, P_R, null)) {
        G.player.x = ox0;
        G.player.y = oy0;
        tryMove(G.player, mx * P_SPD * dt, 0, P_R);
        if (genBlocked(G.player.x, G.player.y, P_R, null)) G.player.x = ox0;
        tryMove(G.player, 0, my * P_SPD * dt, P_R);
        if (genBlocked(G.player.x, G.player.y, P_R, null)) G.player.y = oy0;
      }
    }
    tryMelee();
    if (fireHold) firePlayer(G.player.fx, G.player.fy);

    const c = G.player.x | 0;
    const r = G.player.y | 0;
    grabCell(c, r);
    const t = cellAt(G.player.x, G.player.y);
    if (t === EXIT && G.ready <= 0) nextFloor();
  }

  function steer4(mon, wantX, wantY) {
    let best = null;
    let bestDot = -999;
    const wx = wantX - mon.x;
    const wy = wantY - mon.y;
    const wl = hypot(wx, wy) || 1;
    const ux = wx / wl;
    const uy = wy / wl;
    for (let i = 0; i < 4; i++) {
      const dx = DX[i];
      const dy = DY[i];
      const nx = mon.x + dx * 0.5;
      const ny = mon.y + dy * 0.5;
      if (blocked(nx, ny, mon.r)) continue;
      if (genBlocked(nx, ny, mon.r * 0.7, mon.parent)) continue;
      const dot = dx * ux + dy * uy;
      if (dot > bestDot) {
        bestDot = dot;
        best = i;
      }
    }
    if (best != null) {
      mon.fx = DX[best];
      mon.fy = DY[best];
    }
  }

  function updateGens(dt) {
    const cap = G.kind === 'horde' ? MAX_MON_HORDE : MAX_MON;
    for (let i = 0; i < G.gens.length; i++) {
      const g = G.gens[i];
      if (!g.alive) continue;
      g.pulse += dt * 5;
      g.cd -= dt;
      if (g.cd > 0) continue;
      g.cd = G.spawnInt * rand(0.82, 1.18);
      if (g.kids >= 4) continue;
      if (liveMons() >= cap) continue;
      let born = null;
      for (let k = 0; k < 4 && !born; k++) {
        const x = g.x + DX[k] * 0.78;
        const y = g.y + DY[k] * 0.78;
        if (hypot(x - G.player.x, y - G.player.y) < 0.7) continue;
        if (blocked(x, y, tR(g.kind))) continue;
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

  function hurtWhy(kind) {
    if (kind === 'wraith') return '影贴上来了';
    if (kind === 'zombie') return '尸咬上了';
    return '骨撞上了';
  }

  function updateMons(dt) {
    const p = G.player;
    for (let i = 0; i < G.mons.length; i++) {
      const mon = G.mons[i];
      if (!mon.alive) continue;
      mon.thinkT -= dt;
      mon.walk += dt * (mon.kind === 'wraith' ? 8 : 11);
      const t = TYPE[mon.kind] || TYPE.bone;
      const spd = t.spd + Math.min(0.55, G.stage * 0.07) + (G.kind === 'horde' ? 0.18 : 0);
      if (mon.thinkT <= 0) {
        mon.thinkT = 0.12 + Math.random() * 0.16;
        steer4(mon, p.x + rand(-0.15, 0.15), p.y + rand(-0.15, 0.15));
      }
      tryMove(mon, mon.fx * spd * dt, mon.fy * spd * dt, mon.r);
    }

    if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && G.hurtCd <= 0 && G.player.meleeI <= 0) {
      for (let i = 0; i < G.mons.length; i++) {
        const mon = G.mons[i];
        if (!mon.alive) continue;
        if (hypot(mon.x - p.x, mon.y - p.y) < mon.r + P_R * 0.92) {
          const t = TYPE[mon.kind] || TYPE.bone;
          hurtPlayer(t.dmg, hurtWhy(mon.kind));
          break;
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
        } else if (s.from === 'p' && (t === FOOD || t === LOOT)) {
          destroyPickup(s.x | 0, s.y | 0, s);
          live = false;
        } else if (s.from === 'p') {
          for (let g = 0; g < G.gens.length; g++) {
            const gen = G.gens[g];
            if (!gen.alive) continue;
            if (hypot(s.x - gen.x, s.y - gen.y) < G_R + S_R) {
              hitGen(gen, s.dmg);
              live = false;
              break;
            }
          }
          if (!live) break;
          for (let m = 0; m < G.mons.length; m++) {
            const mon = G.mons[m];
            if (!mon.alive) continue;
            if (hypot(s.x - mon.x, s.y - mon.y) < mon.r + S_R) {
              hitMon(mon, s.dmg, false);
              live = false;
              break;
            }
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
    for (let i = slashes.length - 1; i >= 0; i--) {
      slashes[i].t -= dt;
      if (slashes[i].t <= 0) slashes.splice(i, 1);
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
    if (G.t % 2.4 < dt) {
      const d = (Math.random() * 4) | 0;
      G.player.fx = DX[d];
      G.player.fy = DY[d];
    }
    tryMove(G.player, G.player.fx * 1.45 * dt, G.player.fy * 1.45 * dt, P_R);
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
    if (autoOn) tickAuto(dt);
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

  function drawGuy(x, y, fx, fy, rgb, walk) {
    const px = sx(x);
    const py = sy(y);
    const s = cell;
    const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
    ctx.save();
    if (blink) ctx.globalAlpha = 0.45;
    ctx.shadowColor = rgba(rgb, 0.8);
    ctx.shadowBlur = 12 * dpr;
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.beginPath();
    ctx.arc(px, py - s * 0.16, s * 0.13, 0, TAU);
    ctx.fill();
    ctx.fillRect(px - s * 0.07, py - s * 0.04, s * 0.14, s * 0.2);
    const swing = Math.sin(walk) * s * 0.07;
    ctx.fillRect(px - s * 0.1, py + s * 0.14, s * 0.07, s * 0.16 + swing);
    ctx.fillRect(px + s * 0.03, py + s * 0.14, s * 0.07, s * 0.16 - swing);
    ctx.strokeStyle = rgba(GOLD, 0.95);
    ctx.lineWidth = Math.max(2, s * 0.06);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(px + fx * s * 0.04, py + fy * s * 0.02);
    ctx.lineTo(px + fx * s * 0.34, py + fy * s * 0.32);
    ctx.stroke();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(px + fx * s * 0.34, py + fy * s * 0.32, s * 0.045, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawBone(m) {
    const px = sx(m.x);
    const py = sy(m.y);
    const s = cell;
    const bob = Math.sin(m.walk) * s * 0.03;
    ctx.save();
    ctx.shadowColor = rgba(m.rgb, 0.7);
    ctx.shadowBlur = 10 * dpr;
    ctx.fillStyle = rgba(m.rgb, 0.95);
    ctx.beginPath();
    ctx.arc(px, py - s * 0.1 + bob, s * 0.15, 0, TAU);
    ctx.fill();
    ctx.fillRect(px - s * 0.12, py - s * 0.02 + bob, s * 0.24, s * 0.2);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0a0704';
    ctx.fillRect(px - s * 0.07, py - s * 0.14 + bob, s * 0.045, s * 0.055);
    ctx.fillRect(px + s * 0.025, py - s * 0.14 + bob, s * 0.045, s * 0.055);
    ctx.restore();
  }

  function drawZombie(m) {
    const px = sx(m.x);
    const py = sy(m.y);
    const s = cell;
    const bob = Math.sin(m.walk * 0.7) * s * 0.02;
    ctx.save();
    ctx.shadowColor = rgba(m.rgb, 0.7);
    ctx.shadowBlur = 10 * dpr;
    ctx.fillStyle = rgba(m.rgb, 0.95);
    ctx.beginPath();
    ctx.ellipse(px, py + bob, s * 0.18, s * 0.22, 0, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0a0704';
    ctx.beginPath();
    ctx.arc(px - s * 0.05, py - s * 0.06 + bob, s * 0.03, 0, TAU);
    ctx.arc(px + s * 0.05, py - s * 0.06 + bob, s * 0.03, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.7);
    ctx.fillRect(px - s * 0.04, py + s * 0.04 + bob, s * 0.08, s * 0.03);
    ctx.restore();
  }

  function drawWraith(m) {
    const px = sx(m.x);
    const py = sy(m.y);
    const s = cell;
    ctx.save();
    ctx.globalAlpha = 0.58 + 0.28 * Math.sin(G.t * 5 + m.y);
    ctx.shadowColor = rgba(PUR, 0.85);
    ctx.shadowBlur = 14 * dpr;
    ctx.fillStyle = rgba(PUR, 0.9);
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
    ctx.fillStyle = '#0a0704';
    ctx.beginPath();
    ctx.arc(px - s * 0.05, py - s * 0.04, s * 0.035, 0, TAU);
    ctx.arc(px + s * 0.05, py - s * 0.04, s * 0.035, 0, TAU);
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
    ctx.fillStyle = '#2a1608';
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
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = rgba(HOT, 0.85);
    ctx.fillRect(px - s * 0.14, py + s * 0.2, s * 0.28 * hpK, s * 0.035);
    ctx.restore();
  }

  function drawFood(c, r) {
    const px = sx(c + 0.5);
    const py = sy(r + 0.5);
    const s = cell;
    ctx.save();
    ctx.shadowColor = rgba(GRN, 0.7);
    ctx.shadowBlur = 8 * dpr;
    ctx.fillStyle = rgba(GRN, 0.95);
    ctx.beginPath();
    ctx.arc(px, py + s * 0.02, s * 0.16, 0, TAU);
    ctx.fill();
    ctx.fillStyle = GOLD;
    ctx.fillRect(px - s * 0.05, py - s * 0.12, s * 0.1, s * 0.08);
    ctx.restore();
  }

  function drawLoot(c, r) {
    const px = sx(c + 0.5);
    const py = sy(r + 0.5);
    const s = cell;
    ctx.save();
    ctx.shadowColor = rgba(GOLD, 0.75);
    ctx.shadowBlur = 8 * dpr;
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.fillRect(px - s * 0.16, py - s * 0.1, s * 0.32, s * 0.22);
    ctx.fillStyle = HOT;
    ctx.fillRect(px - s * 0.1, py - s * 0.04, s * 0.2, s * 0.06);
    ctx.restore();
  }

  function drawExit(c, r) {
    const px = sx(c + 0.5);
    const py = sy(r + 0.5);
    const s = cell;
    const gold = G.cleared;
    const rgb = gold ? GOLD : CYN;
    const pulse = 0.7 + 0.3 * Math.sin(G.t * 5);
    ctx.save();
    ctx.shadowColor = rgba(rgb, 0.85);
    ctx.shadowBlur = 16 * dpr * pulse;
    ctx.strokeStyle = rgba(rgb, 0.9);
    ctx.lineWidth = Math.max(2, s * 0.06);
    ctx.beginPath();
    ctx.arc(px, py, s * 0.32 * pulse, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px, py, s * 0.16, 0, TAU);
    ctx.fillStyle = rgba(rgb, 0.35 + 0.25 * pulse);
    ctx.fill();
    ctx.restore();
  }

  function drawWall(c, r) {
    const x = sx(c);
    const y = sy(r);
    const s = cell;
    ctx.fillStyle = '#1a1008';
    ctx.fillRect(x, y, s + 0.5, s + 0.5);
    ctx.strokeStyle = 'rgba(255, 122, 24, 0.28)';
    ctx.lineWidth = Math.max(1, s * 0.04);
    ctx.strokeRect(x + 1, y + 1, s - 2, s - 2);
    ctx.fillStyle = 'rgba(255, 177, 74, 0.08)';
    ctx.fillRect(x + s * 0.12, y + s * 0.12, s * 0.28, s * 0.18);
  }

  function drawFloor(c, r) {
    const x = sx(c);
    const y = sy(r);
    const s = cell;
    const shade = ((c + r) & 1) ? 0.07 : 0.04;
    ctx.fillStyle = 'rgba(255, 150, 60, ' + shade + ')';
    ctx.fillRect(x, y, s + 0.5, s + 0.5);
  }

  function draw() {
    if (!ctx) return;
    ctx.fillStyle = '#080502';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    const punch = REDUCE ? 1 : G.punch;
    let shx = 0;
    let shy = 0;
    if (G.shake > 0 && !REDUCE) {
      shx = (Math.random() - 0.5) * G.shake * dpr * 0.35;
      shy = (Math.random() - 0.5) * G.shake * dpr * 0.35;
    }
    ctx.translate(shx, shy);
    ctx.translate(ox + COLS * cell * 0.5, oy + ROWS * cell * 0.5);
    ctx.scale(punch, punch);
    ctx.translate(-(ox + COLS * cell * 0.5), -(oy + ROWS * cell * 0.5));

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.6 + 0.4 * Math.sin(G.t * 0.7 + m.p * TAU));
      ctx.fillStyle = rgba(HOT, a);
      ctx.beginPath();
      ctx.arc(ox + m.x * COLS * cell, oy + m.y * ROWS * cell, m.r, 0, TAU);
      ctx.fill();
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = G.grid[idx(c, r)];
        if (t === WALL) drawWall(c, r);
        else drawFloor(c, r);
      }
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = G.grid[idx(c, r)];
        if (t === EXIT) drawExit(c, r);
        else if (t === FOOD) drawFood(c, r);
        else if (t === LOOT) drawLoot(c, r);
      }
    }

    for (let i = 0; i < G.gens.length; i++) {
      if (G.gens[i].alive) drawGen(G.gens[i]);
    }

    for (let i = 0; i < G.mons.length; i++) {
      const m = G.mons[i];
      if (!m.alive) continue;
      if (m.kind === 'wraith') drawWraith(m);
      else if (m.kind === 'zombie') drawZombie(m);
      else drawBone(m);
    }

    if (G.deadT <= 0) {
      drawGuy(G.player.x, G.player.y, G.player.fx, G.player.fy, CYN, G.player.walk);
    }

    for (let i = 0; i < lasers.length; i++) {
      const L = lasers[i];
      const a = L.t / 0.08;
      ctx.strokeStyle = rgba(L.rgb, a * 0.85);
      ctx.lineWidth = Math.max(2, cell * 0.06);
      ctx.beginPath();
      ctx.moveTo(sx(L.x), sy(L.y));
      ctx.lineTo(sx(L.x + L.ux * 0.55), sy(L.y + L.uy * 0.55));
      ctx.stroke();
    }

    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.save();
      ctx.shadowColor = rgba(s.rgb, 0.9);
      ctx.shadowBlur = 10 * dpr;
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), cell * 0.11, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    for (let i = 0; i < slashes.length; i++) {
      const sl = slashes[i];
      const a = sl.t / sl.life;
      const ang = Math.atan2(sl.fy, sl.fx);
      ctx.save();
      ctx.strokeStyle = rgba(GOLD, a);
      ctx.lineWidth = Math.max(2, cell * 0.08);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(sx(sl.x), sy(sl.y), cell * 0.46, ang - 0.9, ang + 0.9);
      ctx.stroke();
      ctx.restore();
    }

    for (let i = 0; i < rings.length; i++) {
      const rg = rings[i];
      const k = rg.t / 0.34;
      ctx.strokeStyle = rgba(rg.rgb, 1 - k);
      ctx.lineWidth = Math.max(1.5, cell * 0.05 * (1 - k));
      ctx.beginPath();
      ctx.arc(sx(rg.x), sy(rg.y), cell * (0.16 + k * 0.5), 0, TAU);
      ctx.stroke();
    }

    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = q.t / q.life;
      ctx.fillStyle = rgba(q.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), Math.max(0.6, q.r * cell), 0, TAU);
      ctx.fill();
    }

    ctx.font = '700 ' + Math.max(10, cell * 0.32) + 'px "Segoe UI","PingFang SC",sans-serif';
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
    if (autoOn) return;
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
      const s = snap4(dx, dy);
      ptr.dx = s[0];
      ptr.dy = s[1];
    }
  }

  function onPointerUp(e) {
    if (ptr.id != null && e.pointerId !== ptr.id) return;
    if (ptr.down && !ptr.dragging && !overlayBlocksPlay() && !autoOn) {
      const dx = ptr.x - G.player.x;
      const dy = ptr.y - G.player.y;
      if (hypot(dx, dy) > 0.05) {
        const s = snap4(dx, dy);
        firePlayer(s[0], s[1]);
      } else firePlayer(G.player.fx, G.player.fy);
    }
    ptr.down = false;
    ptr.dragging = false;
    ptr.dx = 0;
    ptr.dy = 0;
    ptr.id = null;
  }

  function setKey(dir, down) {
    if (dir === 'up') {
      keys.u = down;
      if (down) lastAxis = 1;
    }
    if (dir === 'down') {
      keys.d = down;
      if (down) lastAxis = 1;
    }
    if (dir === 'left') {
      keys.l = down;
      if (down) lastAxis = 0;
    }
    if (dir === 'right') {
      keys.r = down;
      if (down) lastAxis = 0;
    }
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startClear();
      return;
    }
    if (G.mode === 'win' || G.mode === 'lose') restart();
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    if (k === 'm' || k === 'M') {
      e.preventDefault();
      if (down && !e.repeat) {
        audio.ensure();
        audio.setMuted(!audio.muted);
      }
      return;
    }
    if (k === 'r' || k === 'R') {
      e.preventDefault();
      if (down && !e.repeat) restart();
      return;
    }
    if (k === 'a' || k === 'A' || code === 'KeyA') {
      e.preventDefault();
      if (down && !e.repeat) toggleAuto();
      return;
    }
    if (e.target === speedEl || (e.target && e.target.tagName === 'INPUT')) return;
    const isUp = k === 'ArrowUp' || k === 'w' || k === 'W' || code === 'KeyW';
    const isDn = k === 'ArrowDown' || k === 's' || k === 'S' || code === 'KeyS';
    const isLf = k === 'ArrowLeft';
    const isRt = k === 'ArrowRight' || k === 'd' || k === 'D' || code === 'KeyD';
    const isSp = k === ' ' || k === 'Spacebar' || code === 'Space';
    if (isUp || isDn || isLf || isRt || isSp) e.preventDefault();
    if (autoOn) {
      if (!down) return;
      if (e.repeat) return;
      if ((isSp || k === 'Enter') && overlayOpen()) {
        if (e.target && e.target.tagName === 'BUTTON') return;
        audio.ensure();
        primaryAction();
      }
      return;
    }
    if (overlayBlocksPlay()) {
      if (isUp) keys.u = false;
      if (isDn) keys.d = false;
      if (isLf) keys.l = false;
      if (isRt) keys.r = false;
      if (isSp) fireHold = false;
    } else {
      if (isUp) setKey('up', down);
      if (isDn) setKey('down', down);
      if (isLf) setKey('left', down);
      if (isRt) setKey('right', down);
      if (isSp) fireHold = down;
    }
    if (!down) return;
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
      if (autoOn) return;
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
    for (let i = 0; i < 22; i++) {
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

  if (btnClear) btnClear.addEventListener('click', function () { audio.ensure(); startClear(); });
  if (btnHorde) btnHorde.addEventListener('click', function () { audio.ensure(); startHorde(); });
  if (ovAgain) ovAgain.addEventListener('click', function () { primaryAction(); });
  if (ovMenu) ovMenu.addEventListener('click', function () { audio.ensure(); bootTitle(); });
  if (btnRetry) btnRetry.addEventListener('click', function () { restart(); });
  if (btnAuto) btnAuto.addEventListener('click', function () { toggleAuto(); });
  if (speedEl) {
    speedEl.addEventListener('input', function () { setAutoSpeed(speedEl.value); });
    speedEl.addEventListener('change', function () { setAutoSpeed(speedEl.value); });
  }
  if (btnMute) btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  if (modeClear) modeClear.addEventListener('click', function () {
    audio.ensure();
    startClear();
  });
  if (modeHorde) modeHorde.addEventListener('click', function () {
    audio.ensure();
    startHorde();
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
  autoSpeed = loadAutoSpeed();
  syncSpeedUi();
  syncAutoUi();
  resize();
  bootTitle();
  syncHud();

  if (padEl && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
    setHint(autoOn ? '托管中 · A 停下' : '滑动走 · 点按或射开火 · 贴身斩 · A 自动 · 出口随时可进', autoOn ? 'hot' : '');
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
    acc += dt * autoScale();
    let steps = 0;
    const maxSteps = autoOn && autoSpeed >= 4 ? 16 : 5;
    while (acc >= STEP && steps < maxSteps) {
      update(STEP);
      acc -= STEP;
      steps += 1;
    }
    if (acc > STEP * maxSteps) acc = 0;
    draw();
  }
  requestAnimationFrame(frame);
})();
