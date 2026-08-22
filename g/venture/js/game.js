'use strict';

(function () {
  const HALL_C = 21;
  const HALL_R = 13;
  const ROOM_C = 17;
  const ROOM_R = 11;
  const EMPTY = 0;
  const WALL = 1;
  const DOOR = 2;
  const ROOMTILE = 3;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const P_SPD = 4.58;
  const P_R = 0.28;
  const P_SHOT = 14.4;
  const COMBO_WIN = 1.52;
  const STAGES = 4;
  const BEST_KEY = 'playbox-venture-best';
  const MUTE_KEY = 'playbox-venture-mute';
  const DX = [0, 1, 0, -1];
  const DY = [-1, 0, 1, 0];
  const OPS = 'WASD / 方向键走 · 空格朝面射击 · R 重开 · M 静音';

  const MAG = [255, 90, 138];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 90, 31];
  const WHT = [255, 244, 232];
  const ORN = [255, 138, 42];

  const KINDS = {
    spy: { id: 'spy', name: '蛛', room: '蛛厅', spd: 2.18, r: 0.26, hp: 1, score: 40, rgb: [255, 122, 48] },
    snk: { id: 'snk', name: '蛇', room: '蛇窖', spd: 2.62, r: 0.3, hp: 1, score: 60, rgb: [70, 220, 130] },
    two: { id: 'two', name: '双头', room: '双头房', spd: 1.7, r: 0.38, hp: 2, score: 120, rgb: [255, 90, 138] },
    skl: { id: 'skl', name: '骸', room: '骸室', spd: 2.38, r: 0.3, hp: 1, score: 80, rgb: [214, 226, 236] },
    trl: { id: 'trl', name: '巨魔', room: '巨魔厅', spd: 2.02, r: 0.36, hp: 2, score: 140, rgb: [168, 220, 64] },
    wrm: { id: 'wrm', name: '龙', room: '龙巢', spd: 2.92, r: 0.34, hp: 2, score: 180, rgb: [255, 58, 64] }
  };

  const LOOT = [
    { id: 'cup', name: '金杯', score: 200 },
    { id: 'crown', name: '王冠', score: 260 },
    { id: 'idol', name: '神像', score: 320 },
    { id: 'chest', name: '宝箱', score: 380 },
    { id: 'gem', name: '钻石', score: 440 },
    { id: 'relic', name: '圣物', score: 520 }
  ];

  const DUNGEONS = [
    {
      name: '初窟',
      rooms: ['spy', 'spy', 'snk', 'skl', 'snk', 'two'],
      n: [4, 4, 4, 4, 5, 3],
      hallDelay: 13.5,
      hallGap: 7.6,
      roomDelay: 16.5,
      hallSpd: 1.78,
      maxHall: 2,
      spd: 1
    },
    {
      name: '蛇窟',
      rooms: ['snk', 'snk', 'spy', 'skl', 'two', 'trl'],
      n: [5, 5, 5, 4, 3, 3],
      hallDelay: 12,
      hallGap: 6.8,
      roomDelay: 15,
      hallSpd: 1.96,
      maxHall: 2,
      spd: 1.08
    },
    {
      name: '魔窟',
      rooms: ['two', 'trl', 'skl', 'snk', 'trl', 'wrm'],
      n: [3, 3, 5, 5, 4, 3],
      hallDelay: 10.8,
      hallGap: 6.2,
      roomDelay: 13.5,
      hallSpd: 2.14,
      maxHall: 2,
      spd: 1.16
    },
    {
      name: '龙窟',
      rooms: ['wrm', 'wrm', 'trl', 'two', 'skl', 'spy'],
      n: [3, 4, 4, 3, 5, 6],
      hallDelay: 9.6,
      hallGap: 5.4,
      roomDelay: 12,
      hallSpd: 2.34,
      maxHall: 3,
      spd: 1.24
    }
  ];

  const ROOM_DEFS = [
    { c: 1, r: 1, w: 5, h: 4, doorC: 3, doorR: 4, side: 2 },
    { c: 8, r: 1, w: 5, h: 4, doorC: 10, doorR: 4, side: 2 },
    { c: 15, r: 1, w: 5, h: 4, doorC: 17, doorR: 4, side: 2 },
    { c: 1, r: 8, w: 5, h: 4, doorC: 3, doorR: 8, side: 0 },
    { c: 8, r: 8, w: 5, h: 4, doorC: 10, doorR: 8, side: 0 },
    { c: 15, r: 8, w: 5, h: 4, doorC: 17, doorR: 8, side: 0 }
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

  function hallIdx(c, r) {
    return r * HALL_C + c;
  }
  function roomIdx(c, r) {
    return r * ROOM_C + c;
  }

  function buildHallGrid(stage) {
    const grid = new Uint8Array(HALL_C * HALL_R);
    grid.fill(WALL);
    for (let c = 1; c < HALL_C - 1; c++) {
      grid[hallIdx(c, 5)] = EMPTY;
      grid[hallIdx(c, 6)] = EMPTY;
      grid[hallIdx(c, 7)] = EMPTY;
    }
    for (let i = 0; i < ROOM_DEFS.length; i++) {
      const d = ROOM_DEFS[i];
      for (let r = d.r; r < d.r + d.h; r++) {
        for (let c = d.c; c < d.c + d.w; c++) {
          grid[hallIdx(c, r)] = ROOMTILE;
        }
      }
      grid[hallIdx(d.doorC, d.doorR)] = DOOR;
      if (d.side === 2) grid[hallIdx(d.doorC, 5)] = EMPTY;
      else grid[hallIdx(d.doorC, 7)] = EMPTY;
    }
    if (stage >= 2) {
      grid[hallIdx(6, 6)] = WALL;
      grid[hallIdx(14, 6)] = WALL;
    }
    if (stage >= 3) {
      grid[hallIdx(4, 5)] = WALL;
      grid[hallIdx(16, 7)] = WALL;
    }
    return grid;
  }

  function floodHall(grid, sc, sr) {
    const seen = new Uint8Array(HALL_C * HALL_R);
    const q = [sc, sr];
    seen[hallIdx(sc, sr)] = 1;
    let qi = 0;
    while (qi < q.length) {
      const c = q[qi++];
      const r = q[qi++];
      for (let d = 0; d < 4; d++) {
        const nc = c + DX[d];
        const nr = r + DY[d];
        if (nc < 0 || nr < 0 || nc >= HALL_C || nr >= HALL_R) continue;
        if (seen[hallIdx(nc, nr)]) continue;
        const t = grid[hallIdx(nc, nr)];
        if (t === WALL || t === ROOMTILE) continue;
        seen[hallIdx(nc, nr)] = 1;
        q.push(nc, nr);
      }
    }
    return seen;
  }

  function hallOk(grid) {
    if (grid[hallIdx(10, 6)] === WALL || grid[hallIdx(10, 6)] === ROOMTILE) return false;
    const seen = floodHall(grid, 10, 6);
    for (let i = 0; i < ROOM_DEFS.length; i++) {
      const d = ROOM_DEFS[i];
      if (grid[hallIdx(d.doorC, d.doorR)] !== DOOR) return false;
      if (!seen[hallIdx(d.doorC, d.doorR)]) return false;
    }
    return true;
  }

  function carveRoom(grid, c0, r0, c1, r1) {
    let c = c0;
    let r = r0;
    let guard = 80;
    while ((c !== c1 || r !== r1) && guard-- > 0) {
      if (c !== c1) c += c1 > c ? 1 : -1;
      else r += r1 > r ? 1 : -1;
      if (c > 0 && r > 0 && c < ROOM_C - 1 && r < ROOM_R - 1) grid[roomIdx(c, r)] = EMPTY;
    }
  }

  function floodRoom(grid, sc, sr) {
    const seen = new Uint8Array(ROOM_C * ROOM_R);
    const q = [sc, sr];
    seen[roomIdx(sc, sr)] = 1;
    let qi = 0;
    while (qi < q.length) {
      const c = q[qi++];
      const r = q[qi++];
      for (let d = 0; d < 4; d++) {
        const nc = c + DX[d];
        const nr = r + DY[d];
        if (nc < 0 || nr < 0 || nc >= ROOM_C || nr >= ROOM_R) continue;
        if (seen[roomIdx(nc, nr)]) continue;
        const t = grid[roomIdx(nc, nr)];
        if (t === WALL) continue;
        seen[roomIdx(nc, nr)] = 1;
        q.push(nc, nr);
      }
    }
    return seen;
  }

  function stampObstacles(grid, kind, rng) {
    function wall(c, r) {
      if (c > 0 && r > 0 && c < ROOM_C - 1 && r < ROOM_R - 1) grid[roomIdx(c, r)] = WALL;
    }
    if (kind === 'spy') {
      [[3, 3], [3, 7], [13, 3], [13, 7], [5, 5], [11, 5], [6, 2], [10, 8]].forEach(function (p) {
        wall(p[0], p[1]);
      });
    } else if (kind === 'snk') {
      for (let c = 2; c <= 6; c++) wall(c, 3);
      for (let c = 10; c <= 14; c++) wall(c, 3);
      for (let c = 2; c <= 6; c++) wall(c, 7);
      for (let c = 10; c <= 14; c++) wall(c, 7);
    } else if (kind === 'two') {
      for (let r = 2; r <= 4; r++) wall(5, r);
      for (let r = 6; r <= 8; r++) wall(5, r);
      for (let r = 2; r <= 4; r++) wall(11, r);
      for (let r = 6; r <= 8; r++) wall(11, r);
    } else if (kind === 'skl') {
      for (let c = 4; c <= 12; c++) {
        if (c !== 8) wall(c, 5);
      }
      for (let r = 2; r <= 8; r++) {
        if (r !== 5) wall(8, r);
      }
      wall(8, 5);
      grid[roomIdx(8, 3)] = EMPTY;
      grid[roomIdx(8, 7)] = EMPTY;
      grid[roomIdx(5, 5)] = EMPTY;
      grid[roomIdx(11, 5)] = EMPTY;
    } else if (kind === 'trl') {
      for (let c = 2; c <= 4; c++) for (let r = 2; r <= 3; r++) wall(c, r);
      for (let c = 12; c <= 14; c++) for (let r = 2; r <= 3; r++) wall(c, r);
      for (let c = 2; c <= 4; c++) for (let r = 7; r <= 8; r++) wall(c, r);
      for (let c = 12; c <= 14; c++) for (let r = 7; r <= 8; r++) wall(c, r);
    } else {
      wall(4, 3); wall(5, 4); wall(12, 3); wall(11, 4);
      wall(4, 7); wall(5, 6); wall(12, 7); wall(11, 6);
      wall(3, 5); wall(13, 5);
    }
    if (rng() < 0.45) wall(2, 5);
    if (rng() < 0.45) wall(14, 5);
  }

  function keepDoorLane(grid, side) {
    const dc = ROOM_C >> 1;
    for (let r = 1; r < ROOM_R - 1; r++) grid[roomIdx(dc, r)] = EMPTY;
    if (side === 2) {
      grid[roomIdx(dc, ROOM_R - 1)] = DOOR;
      grid[roomIdx(dc, ROOM_R - 2)] = EMPTY;
    } else {
      grid[roomIdx(dc, 0)] = DOOR;
      grid[roomIdx(dc, 1)] = EMPTY;
    }
  }

  function buildRoomGrid(kind, side, seed) {
    const grid = new Uint8Array(ROOM_C * ROOM_R);
    grid.fill(WALL);
    for (let r = 1; r < ROOM_R - 1; r++) {
      for (let c = 1; c < ROOM_C - 1; c++) grid[roomIdx(c, r)] = EMPTY;
    }
    const rng = rngSeed(seed);
    stampObstacles(grid, kind, rng);
    keepDoorLane(grid, side);
    const dc = ROOM_C >> 1;
    const sr = side === 2 ? ROOM_R - 2 : 1;
    let reach = floodRoom(grid, dc, sr);
    for (let r = 1; r < ROOM_R - 1; r++) {
      for (let c = 1; c < ROOM_C - 1; c++) {
        if (grid[roomIdx(c, r)] === WALL) continue;
        if (!reach[roomIdx(c, r)]) {
          carveRoom(grid, dc, sr, c, r);
          reach = floodRoom(grid, dc, sr);
        }
      }
    }
    keepDoorLane(grid, side);
    return grid;
  }

  function roomOk(grid, side) {
    const dc = ROOM_C >> 1;
    const dr = side === 2 ? ROOM_R - 1 : 0;
    if (grid[roomIdx(dc, dr)] !== DOOR) return false;
    const sr = side === 2 ? ROOM_R - 2 : 1;
    const seen = floodRoom(grid, dc, sr);
    let empty = 0;
    for (let r = 1; r < ROOM_R - 1; r++) {
      for (let c = 1; c < ROOM_C - 1; c++) {
        if (grid[roomIdx(c, r)] !== WALL && !seen[roomIdx(c, r)]) return false;
        if (grid[roomIdx(c, r)] === EMPTY) empty += 1;
      }
    }
    return empty > 20;
  }

  function specTimes(kind, stage) {
    const d = DUNGEONS[Math.min(stage, DUNGEONS.length - 1)];
    const chase = kind === 'chase';
    return {
      hallDelay: d.hallDelay * (chase ? 0.5 : 1),
      hallGap: d.hallGap * (chase ? 0.5 : 1),
      roomDelay: d.roomDelay * (chase ? 0.56 : 1),
      hallSpd: d.hallSpd * (chase ? 1.38 : 1),
      maxHall: d.maxHall + (chase ? 1 : 0),
      spd: d.spd * (chase ? 1.12 : 1)
    };
  }

  function selfCheck() {
    if (snap4(3, 0.2) !== 1) throw new Error('snap4 e');
    if (snap4(-2, 0.1) !== 3) throw new Error('snap4 w');
    if (snap4(0.1, 4) !== 2) throw new Error('snap4 s');
    if (snap4(0, -2) !== 0) throw new Error('snap4 n');
    if (multOf(0) !== 1 || multOf(2) !== 2 || multOf(9) !== 5) throw new Error('combo');
    const hunt = specTimes('hunt', 0);
    const chase = specTimes('chase', 0);
    if (!(chase.hallDelay < hunt.hallDelay)) throw new Error('chase delay');
    if (!(chase.hallSpd > hunt.hallSpd)) throw new Error('chase spd');
    for (let s = 0; s < STAGES; s++) {
      const g = buildHallGrid(s);
      if (!hallOk(g)) throw new Error('hall ' + s);
    }
    const kinds = ['spy', 'snk', 'two', 'skl', 'trl', 'wrm'];
    for (let i = 0; i < kinds.length; i++) {
      for (let side = 0; side <= 2; side += 2) {
        const g = buildRoomGrid(kinds[i], side, 100 + i * 17 + side);
        if (!roomOk(g, side)) throw new Error('room ' + kinds[i] + side);
      }
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
    beep(freq, dur, type, vol, slide, delay) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime + (delay || 0);
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
      this.beep(1180, 0.05, 'square', 0.05, 280);
      this.beep(1640, 0.04, 'sawtooth', 0.026, 640);
    },
    boom() {
      this.ensure();
      this.noise(0.13, 0.07, 240);
      this.beep(190, 0.15, 'sawtooth', 0.05, 50);
    },
    chip() {
      this.ensure();
      this.beep(480, 0.05, 'square', 0.035, 180);
      this.noise(0.05, 0.03, 500);
    },
    ping() {
      this.ensure();
      this.beep(880, 0.05, 'triangle', 0.04, 220);
      this.beep(240, 0.08, 'square', 0.03, 80);
    },
    chime() {
      this.ensure();
      this.beep(523, 0.09, 'sine', 0.05, 0, 0);
      this.beep(659, 0.1, 'sine', 0.048, 0, 0.07);
      this.beep(784, 0.12, 'triangle', 0.05, 0, 0.14);
      this.beep(1046, 0.2, 'sine', 0.045, 1560, 0.22);
    },
    combo(n) {
      this.ensure();
      const f = 520 + Math.min(8, n) * 70;
      this.beep(f, 0.07, 'square', 0.04, f * 1.5);
    },
    hurt() {
      this.ensure();
      this.beep(170, 0.16, 'sawtooth', 0.055, 60);
      this.noise(0.12, 0.05, 380);
    },
    door() {
      this.ensure();
      this.beep(392, 0.07, 'sine', 0.035, 784);
    },
    thump() {
      this.ensure();
      this.beep(110, 0.1, 'sine', 0.05, 55);
      this.noise(0.07, 0.04, 200);
    },
    sting() {
      this.ensure();
      this.beep(988, 0.09, 'square', 0.055, 392);
      this.beep(1480, 0.16, 'sawtooth', 0.04, 196);
      this.beep(196, 0.28, 'square', 0.055, 82);
    },
    warn() {
      this.ensure();
      this.beep(440, 0.08, 'square', 0.04, 220);
      this.beep(330, 0.12, 'sawtooth', 0.035, 140);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.05);
      this.beep(659, 0.12, 'sine', 0.045, 0, 0.1);
      this.beep(784, 0.16, 'sine', 0.05, 0, 0.2);
      this.beep(1046, 0.26, 'triangle', 0.05, 1560, 0.32);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.045, 90);
      this.beep(140, 0.3, 'sine', 0.05, 50);
    },
    start() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 784);
    },
    clear() {
      this.ensure();
      this.beep(660, 0.08, 'sine', 0.04, 880);
      this.beep(880, 0.14, 'triangle', 0.045, 0, 0.08);
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
  const btnHunt = el('btn-hunt');
  const btnChase = el('btn-chase');
  const ovAgain = el('ov-again');
  const ovMenu = el('ov-menu');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
  const modeHunt = el('mode-hunt');
  const modeChase = el('mode-chase');
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

  let W = 1;
  let H = 1;
  let dpr = 1;
  let cell = 32;
  let ox = 0;
  let oy = 0;
  let radarH = 0;
  let hidden = false;
  let addTok = 0;
  let chainTok = 0;
  let fireHold = false;
  let fireCd = 0;

  const keys = { u: false, d: false, l: false, r: false };
  const ptr = { down: false, id: null, sx: 0, sy: 0, x: 0, y: 0, dragging: false, dx: 0, dy: 0 };
  const pips = [];
  const particles = [];
  const pops = [];
  const motes = [];
  const rings = [];

  const G = {
    mode: 'title',
    kind: 'hunt',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    cols: HALL_C,
    rows: HALL_R,
    view: 'hall',
    grid: new Uint8Array(HALL_C * HALL_R),
    hallGrid: new Uint8Array(HALL_C * HALL_R),
    rooms: [],
    roomI: -1,
    mobs: [],
    hallMons: [],
    intruder: null,
    pShot: null,
    treasure: null,
    player: { x: 10.5, y: 6.5, face: 1, walk: 0 },
    hallPX: 10.5,
    hallPY: 6.5,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: GOLD,
    toastT: 0,
    deadT: 0,
    ready: 0,
    clearT: 0,
    doorCool: 0,
    hallT: 0,
    nextHall: 13.5,
    roomT: 0,
    blockToastT: 0,
    warnShown: false,
    why: '',
    wantKey: 1,
    times: specTimes('hunt', 0)
  };

  function idx(c, r) {
    return r * G.cols + c;
  }
  function inb(c, r) {
    return c >= 0 && r >= 0 && c < G.cols && r < G.rows;
  }
  function tile(c, r) {
    if (!inb(c, r)) return WALL;
    return G.grid[idx(c, r)];
  }
  function solidTile(t) {
    return t === WALL || t === ROOMTILE;
  }
  function blockedAt(x, y, rad) {
    const rr = rad * 0.88;
    const pts = [
      [x - rr, y - rr], [x + rr, y - rr], [x - rr, y + rr], [x + rr, y + rr],
      [x - rr, y], [x + rr, y], [x, y - rr], [x, y + rr]
    ];
    for (let i = 0; i < pts.length; i++) {
      if (solidTile(tile(Math.floor(pts[i][0]), Math.floor(pts[i][1])))) return true;
    }
    return false;
  }
  function slideMove(e, dx, dy, rad) {
    if (!blockedAt(e.x + dx, e.y, rad)) e.x += dx;
    else if (!blockedAt(e.x + dx * 0.45, e.y, rad)) e.x += dx * 0.45;
    if (!blockedAt(e.x, e.y + dy, rad)) e.y += dy;
    else if (!blockedAt(e.x, e.y + dy * 0.45, rad)) e.y += dy * 0.45;
    e.x = clamp(e.x, rad + 0.02, G.cols - rad - 0.02);
    e.y = clamp(e.y, rad + 0.02, G.rows - rad - 0.02);
  }
  function blockedAtHall(x, y, rad) {
    const rr = rad * 0.88;
    const pts = [
      [x - rr, y - rr], [x + rr, y - rr], [x - rr, y + rr], [x + rr, y + rr],
      [x - rr, y], [x + rr, y], [x, y - rr], [x, y + rr]
    ];
    for (let i = 0; i < pts.length; i++) {
      const c = Math.floor(pts[i][0]);
      const r = Math.floor(pts[i][1]);
      if (c < 0 || r < 0 || c >= HALL_C || r >= HALL_R) return true;
      const t = G.hallGrid[hallIdx(c, r)];
      if (t === WALL || t === ROOMTILE) return true;
    }
    return false;
  }
  function slideMoveHall(e, dx, dy, rad) {
    if (!blockedAtHall(e.x + dx, e.y, rad)) e.x += dx;
    else if (!blockedAtHall(e.x + dx * 0.45, e.y, rad)) e.x += dx * 0.45;
    if (!blockedAtHall(e.x, e.y + dy, rad)) e.y += dy;
    else if (!blockedAtHall(e.x, e.y + dy * 0.45, rad)) e.y += dy * 0.45;
    e.x = clamp(e.x, rad + 0.02, HALL_C - rad - 0.02);
    e.y = clamp(e.y, rad + 0.02, HALL_R - rad - 0.02);
  }

  function dung() {
    return DUNGEONS[Math.min(G.stage, DUNGEONS.length - 1)];
  }
  function takenCount() {
    let n = 0;
    for (let i = 0; i < G.rooms.length; i++) if (G.rooms[i].taken) n += 1;
    return n;
  }
  function liveMobs() {
    let n = 0;
    for (let i = 0; i < G.mobs.length; i++) if (G.mobs[i].alive) n += 1;
    return n;
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
    G.toastT = 1.55;
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
    if (modeHunt) modeHunt.setAttribute('aria-pressed', G.kind === 'hunt' ? 'true' : 'false');
    if (modeChase) modeChase.setAttribute('aria-pressed', G.kind === 'chase' ? 'true' : 'false');
  }
  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2);
    if (stageLabel) {
      const d = dung();
      stageLabel.textContent = (G.kind === 'chase' ? '追逼 · ' : '') + d.name;
      stageLabel.classList.toggle('hot', G.stage === STAGES - 1);
    }
    if (tagLabel) {
      const left = G.rooms.length - takenCount();
      if (G.hallMons.length > 0 || G.intruder) {
        tagLabel.textContent = '廊兽 ' + (G.hallMons.length + (G.intruder ? 1 : 0));
        tagLabel.className = 'warn';
      } else if (G.view === 'room' && G.roomT > G.times.roomDelay - 3 && !G.intruder) {
        tagLabel.textContent = '廊兽将至';
        tagLabel.className = 'hot';
      } else {
        tagLabel.textContent = '宝 ' + takenCount() + '/' + G.rooms.length;
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
      if (ovKicker) ovKicker.textContent = 'VENT';
      if (ovTitle) ovTitle.textContent = '秘窟';
      if (ovLead) ovLead.innerHTML = '走廊进房抢宝物。怪物会追，别被堵住门。<br />廊里耽搁，廊兽就会来。碰到掉命。';
      if (ovOps) ovOps.textContent = OPS;
    } else if (kind === 'win') {
      if (ovKicker) ovKicker.textContent = 'CLEAR';
      if (ovTitle) ovTitle.textContent = G.kind === 'chase' ? '追尽了' : '秘窟探尽';
      if (ovLead) ovLead.textContent = '四窟宝物都到手了。分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '');
      if (ovOps) ovOps.textContent = 'R 重开随时可用';
      if (ovAgain) ovAgain.textContent = '再来一轮';
      if (ovMenu) ovMenu.textContent = '换模式';
    } else {
      if (ovKicker) ovKicker.textContent = 'DOWN';
      if (ovTitle) ovTitle.textContent = G.why || '撞上了';
      if (ovLead) ovLead.textContent = '打到第 ' + (G.stage + 1) + ' 窟。分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '');
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
    if (particles.length > 150) n = Math.min(n, 4);
    for (let i = 0; i < n; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        t: spec.life,
        life: spec.life,
        r: rand(spec.r0, spec.r1),
        rgb: spec.rgb
      });
    }
  }
  function spawnPop(x, y, text, rgb) {
    pops.push({ x: x, y: y - 0.2, text: text, rgb: rgb, t: 0.7, life: 0.7 });
  }
  function spawnRing(x, y, rgb) {
    rings.push({ x: x, y: y, rgb: rgb, t: 0.45, life: 0.45, r: 0.2 });
  }
  function resetFx() {
    particles.length = 0;
    pops.length = 0;
    rings.length = 0;
  }
  function showChain(n) {
    if (!chainPop || REDUCE) return;
    chainPop.textContent = '×' + n;
    chainPop.classList.remove('hidden');
    chainPop.style.animation = 'none';
    void chainPop.offsetWidth;
    chainPop.style.animation = '';
    chainTok += 1;
    const tok = chainTok;
    setTimeout(function () {
      if (tok === chainTok) chainPop.classList.add('hidden');
    }, 700);
  }
  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    G.mult = multOf(G.combo);
    if (G.combo >= 2) {
      showChain(G.mult);
      audio.combo(G.combo);
    }
    syncHud();
  }

  function roomDoor() {
    const side = ROOM_DEFS[G.roomI].side;
    const c = ROOM_C >> 1;
    const r = side === 2 ? ROOM_R - 1 : 0;
    return { c: c, r: r, x: c + 0.5, y: r + 0.5, side: side };
  }

  function doorBlocked() {
    const d = roomDoor();
    const rad = 0.78;
    for (let i = 0; i < G.mobs.length; i++) {
      const e = G.mobs[i];
      if (e.alive && hypot(e.x - d.x, e.y - d.y) < rad + e.r * 0.4) return true;
    }
    if (G.intruder && hypot(G.intruder.x - d.x, G.intruder.y - d.y) < rad + 0.2) return true;
    return false;
  }

  function placeHallPlayer(x, y) {
    G.player.x = x;
    G.player.y = y;
    G.hallPX = x;
    G.hallPY = y;
  }

  function enterRoom(ri) {
    const def = ROOM_DEFS[ri];
    G.view = 'room';
    G.roomI = ri;
    G.hallPX = G.player.x;
    G.hallPY = G.player.y;
    G.cols = ROOM_C;
    G.rows = ROOM_R;
    const inward = (def.side + 2) % 4;
    const d = roomDoor();
    G.player.x = d.x + DX[inward] * 1.25;
    G.player.y = d.y + DY[inward] * 1.25;
    G.player.face = inward;
    buildRoom(ri);
    G.pShot = null;
    G.roomT = 0;
    G.intruder = null;
    G.doorCool = 0.32;
    G.ready = Math.max(G.ready, 0.18);
    audio.door();
    screenFlash(CYN, 0.45);
    const rec = G.rooms[ri];
    toast(rec.name + (rec.taken ? ' · 已取' : ' · ' + rec.loot.name), false, !rec.taken);
    setHint(rec.taken ? '空房 · 出门回廊' : '抢宝 · 别堵在门口', rec.taken ? '' : 'hot');
    layout();
    syncHud();
  }

  function exitRoom() {
    const def = ROOM_DEFS[G.roomI];
    const hadAll = takenCount() === G.rooms.length;
    G.view = 'hall';
    G.cols = HALL_C;
    G.rows = HALL_R;
    G.grid = G.hallGrid;
    G.mobs = [];
    G.intruder = null;
    G.treasure = null;
    G.pShot = null;
    G.roomI = -1;
    G.doorCool = 0.3;
    G.player.x = def.doorC + 0.5 + DX[def.side] * 1.55;
    G.player.y = def.doorR + 0.5 + DY[def.side] * 1.55;
    G.player.face = def.side;
    G.hallPX = G.player.x;
    G.hallPY = G.player.y;
    G.invuln = Math.max(G.invuln, 0.18);
    audio.door();
    screenFlash(ORN, 0.28);
    layout();
    if (hadAll && G.clearT <= 0) beginClear();
    else setHint(G.hallMons.length ? '廊兽在追 · 进下一间' : '进房抢宝 · 廊里别耽搁', G.hallMons.length ? 'warn' : '');
    syncHud();
  }

  function tryExit() {
    if (G.doorCool > 0) return;
    if (doorBlocked()) {
      const d = roomDoor();
      const inward = (d.side + 2) % 4;
      G.player.x += DX[inward] * 0.18;
      G.player.y += DY[inward] * 0.18;
      if (G.blockToastT <= 0) {
        toast('门被堵住了', true);
        audio.thump();
        kick('thump');
        G.blockToastT = 0.85;
      }
      return;
    }
    exitRoom();
  }

  function makeMob(kindId, x, y) {
    const k = KINDS[kindId];
    return {
      kind: kindId,
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      r: k.r,
      hp: k.hp,
      alive: true,
      walk: rand(0, TAU),
      think: rand(0, 0.3),
      charge: kindId === 'wrm' ? rand(1.4, 2.2) : 0,
      hurtT: 0
    };
  }

  function makeHallMon(x, y) {
    return {
      x: x,
      y: y,
      r: 0.44,
      walk: rand(0, TAU),
      think: 0
    };
  }

  function emptyRoomSpots() {
    const out = [];
    for (let r = 1; r < ROOM_R - 1; r++) {
      for (let c = 1; c < ROOM_C - 1; c++) {
        if (G.grid[roomIdx(c, r)] === EMPTY) out.push(c, r);
      }
    }
    return out;
  }

  function buildRoom(ri) {
    const rec = G.rooms[ri];
    const def = ROOM_DEFS[ri];
    const seed = (G.stage + 1) * 7919 + ri * 131 + rec.kind.charCodeAt(0);
    G.grid = buildRoomGrid(rec.kind, def.side, seed);
    for (let a = 1; a < 8 && !roomOk(G.grid, def.side); a++) {
      G.grid = buildRoomGrid(rec.kind, def.side, seed + a * 97);
    }
    G.mobs = [];
    G.treasure = null;
    const d = roomDoor();
    const spots = emptyRoomSpots();
    if (!rec.taken) {
      let best = -1;
      let bc = ROOM_C >> 1;
      let br = def.side === 2 ? 2 : ROOM_R - 3;
      for (let i = 0; i < spots.length; i += 2) {
        const c = spots[i];
        const r = spots[i + 1];
        const dist = hypot(c + 0.5 - d.x, r + 0.5 - d.y);
        if (dist > best) {
          best = dist;
          bc = c;
          br = r;
        }
      }
      G.treasure = { x: bc + 0.5, y: br + 0.5, id: rec.loot.id, name: rec.loot.name, score: rec.loot.score };
    }
    const n = rec.n;
    const k = rec.kind;
    let guard = 0;
    while (G.mobs.length < n && guard++ < 400 && spots.length) {
      const si = ((Math.random() * (spots.length / 2)) | 0) * 2;
      const c = spots[si];
      const r = spots[si + 1];
      const x = c + 0.5;
      const y = r + 0.5;
      if (hypot(x - d.x, y - d.y) < 2.2) continue;
      if (hypot(x - G.player.x, y - G.player.y) < 2.4) continue;
      let near = false;
      for (let i = 0; i < G.mobs.length; i++) {
        if (hypot(x - G.mobs[i].x, y - G.mobs[i].y) < 1.15) near = true;
      }
      if (near) continue;
      G.mobs.push(makeMob(k, x, y));
      spots[si] = spots[spots.length - 2];
      spots[si + 1] = spots[spots.length - 1];
      spots.length -= 2;
    }
  }

  function setupRooms() {
    const d = dung();
    G.rooms = [];
    for (let i = 0; i < 6; i++) {
      G.rooms.push({
        kind: d.rooms[i],
        name: KINDS[d.rooms[i]].room,
        loot: LOOT[i],
        taken: false,
        n: d.n[i]
      });
    }
  }

  function buildDungeon() {
    G.times = specTimes(G.kind, G.stage);
    G.view = 'hall';
    G.cols = HALL_C;
    G.rows = HALL_R;
    G.hallGrid = buildHallGrid(G.stage);
    for (let a = 1; a < 6 && !hallOk(G.hallGrid); a++) {
      G.hallGrid = buildHallGrid(G.stage);
    }
    G.grid = G.hallGrid;
    setupRooms();
    G.mobs = [];
    G.hallMons = [];
    G.intruder = null;
    G.pShot = null;
    G.treasure = null;
    G.roomI = -1;
    G.hallT = 0;
    G.nextHall = G.times.hallDelay;
    G.roomT = 0;
    G.warnShown = false;
    G.clearT = 0;
    G.doorCool = 0.2;
    placeHallPlayer(10.5, 6.5);
    G.player.face = 1;
    G.ready = 0.55;
    G.invuln = 0.7;
    G.deadT = 0;
    resetFx();
    toast(dung().name, false, G.stage === STAGES - 1);
    setHint(G.kind === 'chase' ? '追逼 · 廊兽来得更快' : '进房抢宝 · 廊里别耽搁', G.kind === 'chase' ? 'warn' : '');
    layout();
    syncHud();
  }

  function bootTitle() {
    G.mode = 'title';
    G.kind = G.kind === 'chase' ? 'chase' : 'hunt';
    G.stage = 0;
    G.score = 0;
    G.lives = LIVES;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.why = '';
    G.times = specTimes(G.kind, 0);
    G.view = 'hall';
    G.cols = HALL_C;
    G.rows = HALL_R;
    G.hallGrid = buildHallGrid(0);
    G.grid = G.hallGrid;
    setupRooms();
    G.mobs = [];
    G.hallMons = [];
    G.intruder = null;
    G.pShot = null;
    placeHallPlayer(10.5, 6.5);
    G.player.face = 1;
    G.deadT = 0;
    G.clearT = 0;
    resetFx();
    if (scoreEl) scoreEl.textContent = '0';
    showOverlay('title');
    setHint('进房抢宝 · 别堵在门口 · 廊里别耽搁');
    layout();
    syncHud();
  }

  function startRun(kind) {
    G.kind = kind;
    G.mode = 'play';
    G.stage = 0;
    G.score = 0;
    G.lives = LIVES;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.why = '';
    if (scoreEl) scoreEl.textContent = '0';
    hideOverlay();
    audio.start();
    buildDungeon();
  }
  function startHunt() { startRun('hunt'); }
  function startChase() { startRun('chase'); }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startHunt();
    else startRun(G.kind);
  }

  function beginClear() {
    G.clearT = 1.05;
    const bonus = 500 + G.stage * 120;
    addScore(bonus, G.player.x, G.player.y - 0.4);
    audio.clear();
    kick('win-flash');
    screenFlash(GOLD, 0.7);
    toast(dung().name + ' 清了', false, true);
  }

  function finishClear() {
    G.clearT = 0;
    if (G.stage + 1 >= STAGES) {
      addScore(G.lives * 200, G.player.x, G.player.y);
      G.mode = 'win';
      audio.win();
      kick('win-flash');
      showOverlay('win');
      setHint('秘窟探尽', 'hot');
      syncHud();
      return;
    }
    G.stage += 1;
    buildDungeon();
  }

  function lose(why) {
    G.why = why;
    G.mode = 'lose';
    G.deadT = 0;
    audio.lose();
    kick('die');
    showOverlay('lose');
    setHint(why, 'warn');
    syncHud();
  }

  function hurt(why) {
    if (G.mode !== 'play' || G.invuln > 0 || G.deadT > 0 || G.ready > 0) return;
    G.lives -= 1;
    G.why = why;
    audio.hurt();
    kick('die');
    G.shake = 0.34;
    screenFlash(HOT, 0.9);
    hitStop(0.07);
    emit(18, {
      x: G.player.x, y: G.player.y, j: 0.2,
      vx0: -4, vx1: 4, vy0: -4, vy1: 4,
      life: 0.45, r0: 0.04, r1: 0.11, rgb: HOT
    });
    if (G.lives <= 0) {
      lose(why);
      return;
    }
    G.deadT = 0.55;
    syncHud();
  }

  function respawn() {
    G.deadT = 0;
    G.invuln = 1.42;
    G.pShot = null;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    if (G.view === 'room') {
      const d = roomDoor();
      const inward = (d.side + 2) % 4;
      G.player.x = d.x + DX[inward] * 1.2;
      G.player.y = d.y + DY[inward] * 1.2;
      G.player.face = inward;
    } else {
      placeHallPlayer(10.5, 6.5);
      G.player.face = 1;
    }
    syncHud();
  }

  function grabTreasure() {
    const t = G.treasure;
    if (!t || G.roomI < 0) return;
    G.rooms[G.roomI].taken = true;
    G.treasure = null;
    bumpCombo();
    const n = (t.score + G.stage * 40) * G.mult;
    addScore(n, t.x, t.y);
    audio.chime();
    hitStop(0.045);
    kick('boom');
    screenFlash(GOLD, 0.75);
    spawnRing(t.x, t.y, GOLD);
    emit(22, {
      x: t.x, y: t.y, j: 0.18,
      vx0: -3.2, vx1: 3.2, vy0: -3.8, vy1: 1.5,
      life: 0.55, r0: 0.04, r1: 0.12, rgb: GOLD
    });
    spawnPop(t.x, t.y - 0.35, t.name, GOLD);
    toast('拿到' + t.name, false, true);
    const left = G.rooms.length - takenCount();
    if (left === 0) {
      setHint('宝物齐了 · 出门回廊', 'hot');
      toast('宝物齐了 · 出门', false, true);
    } else {
      setHint('出门回廊 · 还剩 ' + left + ' 件', 'hot');
    }
    syncHud();
  }

  function killMob(e) {
    e.alive = false;
    bumpCombo();
    const k = KINDS[e.kind];
    const n = k.score * G.mult;
    addScore(n, e.x, e.y);
    audio.boom();
    const hs = 0.05 + Math.min(0.03, G.combo * 0.004);
    hitStop(hs);
    G.shake = Math.max(G.shake, 0.16);
    kick('boom');
    screenFlash(k.rgb, 0.55);
    spawnRing(e.x, e.y, k.rgb);
    emit(16, {
      x: e.x, y: e.y, j: 0.16,
      vx0: -4.2, vx1: 4.2, vy0: -4.2, vy1: 3.2,
      life: 0.42, r0: 0.04, r1: 0.13, rgb: k.rgb
    });
    emit(8, {
      x: e.x, y: e.y, j: 0.08,
      vx0: -2, vx1: 2, vy0: -2.5, vy1: 1,
      life: 0.3, r0: 0.03, r1: 0.08, rgb: WHT
    });
  }

  function hitMob(e) {
    e.hp -= 1;
    e.hurtT = 0.12;
    if (e.hp <= 0) {
      killMob(e);
      return;
    }
    audio.chip();
    hitStop(0.03);
    emit(8, {
      x: e.x, y: e.y, j: 0.1,
      vx0: -2.4, vx1: 2.4, vy0: -2.4, vy1: 2.4,
      life: 0.28, r0: 0.03, r1: 0.08, rgb: KINDS[e.kind].rgb
    });
  }

  function firePlayer() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (overlayBlocksPlay()) return;
    if (G.pShot) return;
    if (fireCd > 0) return;
    const d = G.player.face;
    G.pShot = {
      x: G.player.x + DX[d] * 0.32,
      y: G.player.y + DY[d] * 0.32,
      vx: DX[d] * P_SHOT,
      vy: DY[d] * P_SHOT,
      d: d
    };
    audio.zap();
    emit(5, {
      x: G.pShot.x, y: G.pShot.y, j: 0.06,
      vx0: DX[d] * 2, vx1: DX[d] * 5, vy0: DY[d] * 2, vy1: DY[d] * 5,
      life: 0.18, r0: 0.03, r1: 0.07, rgb: CYN
    });
  }

  function wantFromKeys() {
    if (keys.u && G.wantKey === 0) return 0;
    if (keys.r && G.wantKey === 1) return 1;
    if (keys.d && G.wantKey === 2) return 2;
    if (keys.l && G.wantKey === 3) return 3;
    if (keys.u) return 0;
    if (keys.r) return 1;
    if (keys.d) return 2;
    if (keys.l) return 3;
    if (ptr.dragging) return snap4(ptr.dx, ptr.dy);
    return -1;
  }

  function movePlayer(dt) {
    if (G.deadT > 0) return;
    const w = wantFromKeys();
    let vx = 0;
    let vy = 0;
    if (w >= 0) {
      vx = DX[w];
      vy = DY[w];
      G.player.face = w;
    }
    const len = hypot(vx, vy) || 1;
    const sp = P_SPD * dt;
    slideMove(G.player, vx / len * sp, vy / len * sp, P_R);
    if (vx || vy) G.player.walk += dt * 10;
  }

  function chaseMove(e, tx, ty, spd, dt, rad) {
    e.think -= dt;
    let dx = tx - e.x;
    let dy = ty - e.y;
    if (e.kind === 'snk') {
      if (Math.abs(dx) > Math.abs(dy) * 1.25) dy *= 0.25;
      else dx *= 0.25;
    }
    if (e.kind === 'skl' && e.think > 0.15) {
      dx += Math.sin(e.walk * 1.7) * 1.2;
      dy += Math.cos(e.walk * 1.3) * 1.2;
    }
    if (e.kind === 'spy') {
      dx += Math.sin(e.walk * 3.1 + e.x) * 0.55;
      dy += Math.cos(e.walk * 2.6) * 0.55;
    }
    const d = hypot(dx, dy) || 1;
    let sp = spd;
    if (e.kind === 'wrm' && e.charge < 0.28) sp *= 1.7;
    slideMove(e, (dx / d) * sp * dt, (dy / d) * sp * dt, rad);
    e.walk += dt * 8;
  }

  function hallTarget() {
    if (G.view === 'hall') return { x: G.player.x, y: G.player.y };
    const d = ROOM_DEFS[G.roomI];
    return { x: d.doorC + 0.5 + DX[d.side] * 0.85, y: d.doorR + 0.5 + DY[d.side] * 0.85 };
  }

  function spawnHallMon() {
    if (G.hallMons.length >= G.times.maxHall) return;
    const spots = [];
    for (let r = 5; r <= 7; r++) {
      for (let c = 1; c < HALL_C - 1; c++) {
        if (G.hallGrid[hallIdx(c, r)] !== EMPTY) continue;
        const x = c + 0.5;
        const y = r + 0.5;
        const t = hallTarget();
        if (hypot(x - t.x, y - t.y) < 4.5) continue;
        spots.push(x, y);
      }
    }
    if (!spots.length) {
      spots.push(1.5, 6.5, HALL_C - 1.5, 6.5);
    }
    const si = ((Math.random() * (spots.length / 2)) | 0) * 2;
    const hm = makeHallMon(spots[si], spots[si + 1]);
    G.hallMons.push(hm);
    if (G.view === 'hall') {
      spawnRing(hm.x, hm.y, MAG);
      emit(16, {
        x: hm.x, y: hm.y, j: 0.2,
        vx0: -3, vx1: 3, vy0: -3, vy1: 3,
        life: 0.4, r0: 0.05, r1: 0.12, rgb: MAG
      });
    }
    audio.sting();
    toast('廊兽来了', true);
    kick('sting');
    screenFlash(MAG, 0.7);
    hitStop(0.06);
    G.shake = 0.22;
    setHint('廊兽不可击杀 · 进房或躲开', 'warn');
    syncHud();
  }

  function spawnIntruder() {
    if (G.intruder || G.view !== 'room') return;
    const d = roomDoor();
    const inward = (d.side + 2) % 4;
    G.intruder = makeHallMon(d.x + DX[inward] * 0.2, d.y + DY[inward] * 0.2);
    G.intruder.r = 0.42;
    audio.sting();
    toast('廊兽进房了', true);
    kick('sting');
    screenFlash(MAG, 0.8);
    spawnRing(G.intruder.x, G.intruder.y, MAG);
    emit(18, {
      x: G.intruder.x, y: G.intruder.y, j: 0.18,
      vx0: -3, vx1: 3, vy0: -3, vy1: 3,
      life: 0.42, r0: 0.05, r1: 0.12, rgb: MAG
    });
    setHint('廊兽进房 · 把它从门口引开', 'warn');
    syncHud();
  }

  function chaseMoveHall(e, tx, ty, spd, dt, rad) {
    let dx = tx - e.x;
    let dy = ty - e.y;
    const d = hypot(dx, dy) || 1;
    slideMoveHall(e, (dx / d) * spd * dt, (dy / d) * spd * dt, rad);
    e.walk += dt * 8;
  }

  function updateHallMons(dt) {
    const t = hallTarget();
    const spd = G.times.hallSpd;
    for (let i = 0; i < G.hallMons.length; i++) {
      const e = G.hallMons[i];
      chaseMoveHall(e, t.x, t.y, spd, dt, e.r);
      if (G.view === 'hall' && G.deadT <= 0 && hypot(e.x - G.player.x, e.y - G.player.y) < e.r + P_R - 0.04) {
        hurt('廊兽吞了');
      }
    }
  }

  function updateMobs(dt) {
    const scale = G.times.spd;
    for (let i = 0; i < G.mobs.length; i++) {
      const e = G.mobs[i];
      if (!e.alive) continue;
      if (e.hurtT > 0) e.hurtT -= dt;
      const k = KINDS[e.kind];
      if (e.kind === 'wrm') {
        e.charge -= dt;
        if (e.charge <= 0) e.charge = rand(1.5, 2.4);
      }
      e.think -= dt;
      chaseMove(e, G.player.x, G.player.y, k.spd * scale, dt, e.r);
      if (G.deadT <= 0 && hypot(e.x - G.player.x, e.y - G.player.y) < e.r + P_R - 0.05) {
        const door = roomDoor();
        const atDoor = hypot(G.player.x - door.x, G.player.y - door.y) < 0.85;
        hurt(atDoor ? '堵在门里' : '撞上了');
      }
    }
    if (G.intruder) {
      const e = G.intruder;
      chaseMove(e, G.player.x, G.player.y, G.times.hallSpd * 0.92, dt, e.r);
      if (G.deadT <= 0 && hypot(e.x - G.player.x, e.y - G.player.y) < e.r + P_R - 0.04) {
        const door = roomDoor();
        const atDoor = hypot(G.player.x - door.x, G.player.y - door.y) < 0.9;
        hurt(atDoor ? '堵在门里' : '廊兽吞了');
      }
    }
  }

  function shotHitsSolid(x, y) {
    const t = tile(Math.floor(x), Math.floor(y));
    return solidTile(t) || !inb(Math.floor(x), Math.floor(y));
  }

  function puffShot(s, hall) {
    emit(6, {
      x: s.x, y: s.y, j: 0.06,
      vx0: -1.5, vx1: 1.5, vy0: -1.5, vy1: 1.5,
      life: 0.18, r0: 0.03, r1: 0.07, rgb: hall ? MAG : CYN
    });
    G.pShot = null;
    fireCd = 0.06;
  }

  function updateShot(dt) {
    const s = G.pShot;
    if (!s) return;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (s.x < 0.05 || s.y < 0.05 || s.x > G.cols - 0.05 || s.y > G.rows - 0.05 || shotHitsSolid(s.x, s.y)) {
      puffShot(s, false);
      return;
    }
    if (G.view === 'hall') {
      for (let i = 0; i < G.hallMons.length; i++) {
        const e = G.hallMons[i];
        if (hypot(s.x - e.x, s.y - e.y) < e.r + 0.12) {
          audio.ping();
          spawnRing(e.x, e.y, MAG);
          puffShot(s, true);
          return;
        }
      }
      return;
    }
    if (G.intruder && hypot(s.x - G.intruder.x, s.y - G.intruder.y) < G.intruder.r + 0.12) {
      audio.ping();
      spawnRing(G.intruder.x, G.intruder.y, MAG);
      puffShot(s, true);
      return;
    }
    for (let i = 0; i < G.mobs.length; i++) {
      const e = G.mobs[i];
      if (!e.alive) continue;
      if (hypot(s.x - e.x, s.y - e.y) < e.r + 0.14) {
        G.pShot = null;
        fireCd = 0.05;
        hitMob(e);
        return;
      }
    }
  }

  function maybeEnter() {
    if (G.view !== 'hall' || G.doorCool > 0 || G.deadT > 0) return;
    const c = Math.floor(G.player.x);
    const r = Math.floor(G.player.y);
    if (tile(c, r) !== DOOR) return;
    for (let i = 0; i < ROOM_DEFS.length; i++) {
      const d = ROOM_DEFS[i];
      if (d.doorC === c && d.doorR === r) {
        enterRoom(i);
        return;
      }
    }
  }

  function maybeLeave() {
    if (G.view !== 'room' || G.doorCool > 0 || G.deadT > 0) return;
    const d = roomDoor();
    if (hypot(G.player.x - d.x, G.player.y - d.y) < 0.52) tryExit();
    else if (d.side === 2 && G.player.y > ROOM_R - 0.42) tryExit();
    else if (d.side === 0 && G.player.y < 0.42) tryExit();
  }

  function updateFx(dt) {
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 2.8);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 3.4);
    if (G.invuln > 0) G.invuln -= dt;
    if (G.ready > 0) G.ready -= dt;
    if (G.doorCool > 0) G.doorCool -= dt;
    if (G.blockToastT > 0) G.blockToastT -= dt;
    if (fireCd > 0) fireCd -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.t -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= 0.98;
      q.vy += dt * 2.4;
      if (q.t <= 0) particles.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      pops[i].t -= dt;
      pops[i].y -= dt * 0.7;
      if (pops[i].t <= 0) pops.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t -= dt;
      if (rings[i].t <= 0) rings.splice(i, 1);
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    updateFx(dt);
    if (G.mode === 'title') {
      G.player.walk += dt * 4;
      G.player.x = 10.5 + Math.sin(G.clock * 0.6) * 2.2;
      G.player.face = Math.sin(G.clock * 0.6) > 0 ? 1 : 3;
      if (!blockedAt(G.player.x, G.player.y, P_R)) { /* keep */ }
      else G.player.x = 10.5;
      return;
    }
    if (G.mode === 'win' || G.mode === 'lose') return;
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    if (G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0) respawn();
      return;
    }
    if (G.clearT > 0) {
      G.clearT -= dt;
      movePlayer(dt);
      if (G.clearT <= 0) finishClear();
      return;
    }
    movePlayer(dt);
    if (fireHold && !G.pShot && fireCd <= 0) firePlayer();
    updateShot(dt);
    if (G.view === 'hall') {
      G.hallT += dt;
      if (!G.warnShown && G.hallT > G.nextHall - 2.1 && G.hallMons.length < G.times.maxHall) {
        G.warnShown = true;
        toast('廊兽将至', true);
        audio.warn();
      }
      if (G.hallT >= G.nextHall) {
        spawnHallMon();
        G.nextHall = G.hallT + G.times.hallGap;
        G.warnShown = false;
      }
      updateHallMons(dt);
      maybeEnter();
    } else {
      G.roomT += dt;
      if (!G.intruder && G.roomT >= G.times.roomDelay) spawnIntruder();
      updateHallMons(dt);
      updateMobs(dt);
      if (G.treasure && hypot(G.player.x - G.treasure.x, G.player.y - G.treasure.y) < 0.42) {
        grabTreasure();
      }
      maybeLeave();
    }
    syncHud();
  }

  function sx(x) { return ox + x * cell; }
  function sy(y) { return oy + y * cell; }

  function drawWalls() {
    ctx.fillStyle = '#100808';
    ctx.fillRect(ox, oy, G.cols * cell, G.rows * cell);
    for (let r = 0; r < G.rows; r++) {
      for (let c = 0; c < G.cols; c++) {
        const t = G.grid[idx(c, r)];
        if (t === EMPTY) {
          ctx.fillStyle = G.view === 'hall' ? '#1c120e' : '#17100c';
          ctx.fillRect(sx(c), sy(r), cell + 0.5, cell + 0.5);
        } else if (t === WALL) {
          ctx.fillStyle = '#1c0e0a';
          ctx.fillRect(sx(c), sy(r), cell + 0.5, cell + 0.5);
        } else if (t === ROOMTILE) {
          let rec = null;
          for (let i = 0; i < ROOM_DEFS.length; i++) {
            const d = ROOM_DEFS[i];
            if (c >= d.c && c < d.c + d.w && r >= d.r && r < d.r + d.h) rec = G.rooms[i];
          }
          const rgb = rec ? KINDS[rec.kind].rgb : ORN;
          ctx.fillStyle = rec && rec.taken ? 'rgba(28, 18, 14, 0.9)' : rgba(rgb, 0.13);
          ctx.fillRect(sx(c), sy(r), cell + 0.5, cell + 0.5);
        }
      }
    }
    ctx.strokeStyle = 'rgba(255, 138, 42, 0.55)';
    ctx.lineWidth = Math.max(1.15, cell * 0.075);
    ctx.lineCap = 'square';
    ctx.beginPath();
    for (let r = 0; r < G.rows; r++) {
      for (let c = 0; c < G.cols; c++) {
        const t = G.grid[idx(c, r)];
        if (t === WALL || t === ROOMTILE) continue;
        const x = sx(c);
        const y = sy(r);
        const l = solidTile(c === 0 ? WALL : G.grid[idx(c - 1, r)]);
        const ri = solidTile(c === G.cols - 1 ? WALL : G.grid[idx(c + 1, r)]);
        const u = solidTile(r === 0 ? WALL : G.grid[idx(c, r - 1)]);
        const dn = solidTile(r === G.rows - 1 ? WALL : G.grid[idx(c, r + 1)]);
        if (l) { ctx.moveTo(x, y); ctx.lineTo(x, y + cell); }
        if (ri) { ctx.moveTo(x + cell, y); ctx.lineTo(x + cell, y + cell); }
        if (u) { ctx.moveTo(x, y); ctx.lineTo(x + cell, y); }
        if (dn) { ctx.moveTo(x, y + cell); ctx.lineTo(x + cell, y + cell); }
      }
    }
    ctx.stroke();
    if (G.view === 'hall') {
      for (let i = 0; i < ROOM_DEFS.length; i++) {
        const d = ROOM_DEFS[i];
        ctx.strokeStyle = rgba(KINDS[G.rooms[i].kind].rgb, G.rooms[i].taken ? 0.22 : 0.55);
        ctx.lineWidth = Math.max(1.1, cell * 0.07);
        ctx.strokeRect(sx(d.c) + 2, sy(d.r) + 2, d.w * cell - 4, d.h * cell - 4);
      }
    }
    const pulse = 0.45 + 0.35 * Math.sin(G.clock * 5.2);
    for (let r = 0; r < G.rows; r++) {
      for (let c = 0; c < G.cols; c++) {
        if (G.grid[idx(c, r)] !== DOOR) continue;
        let gold = true;
        if (G.view === 'hall') {
          for (let i = 0; i < ROOM_DEFS.length; i++) {
            if (ROOM_DEFS[i].doorC === c && ROOM_DEFS[i].doorR === r) gold = !G.rooms[i].taken;
          }
        } else if (G.roomI >= 0) gold = !G.rooms[G.roomI].taken;
        const col = gold ? GOLD : CYN;
        ctx.fillStyle = rgba(col, 0.12 + pulse * 0.18);
        ctx.fillRect(sx(c), sy(r), cell, cell);
        ctx.strokeStyle = rgba(col, 0.5 + pulse * 0.4);
        ctx.lineWidth = Math.max(1.4, cell * 0.08);
        ctx.strokeRect(sx(c) + 2, sy(r) + 2, cell - 4, cell - 4);
      }
    }
  }

  function drawTreasureIcon(x, y, id, s, a) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = a;
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.strokeStyle = rgba(GOLD, 0.9);
    ctx.lineWidth = Math.max(1.2, s * 0.08);
    if (id === 'cup') {
      ctx.beginPath();
      ctx.moveTo(-s * 0.16, -s * 0.18);
      ctx.lineTo(-s * 0.12, s * 0.08);
      ctx.lineTo(s * 0.12, s * 0.08);
      ctx.lineTo(s * 0.16, -s * 0.18);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(-s * 0.05, s * 0.08, s * 0.1, s * 0.14);
      ctx.fillRect(-s * 0.12, s * 0.2, s * 0.24, s * 0.06);
    } else if (id === 'crown') {
      ctx.beginPath();
      ctx.moveTo(-s * 0.22, s * 0.1);
      ctx.lineTo(-s * 0.22, -s * 0.04);
      ctx.lineTo(-s * 0.08, s * 0.06);
      ctx.lineTo(0, -s * 0.2);
      ctx.lineTo(s * 0.08, s * 0.06);
      ctx.lineTo(s * 0.22, -s * 0.04);
      ctx.lineTo(s * 0.22, s * 0.1);
      ctx.closePath();
      ctx.fill();
    } else if (id === 'idol') {
      ctx.beginPath();
      ctx.arc(0, -s * 0.12, s * 0.1, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-s * 0.16, s * 0.22);
      ctx.lineTo(0, -s * 0.02);
      ctx.lineTo(s * 0.16, s * 0.22);
      ctx.closePath();
      ctx.fill();
    } else if (id === 'chest') {
      ctx.fillRect(-s * 0.2, -s * 0.08, s * 0.4, s * 0.26);
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.fillRect(-s * 0.2, -s * 0.02, s * 0.4, s * 0.05);
      ctx.fillStyle = rgba(GOLD, 1);
      ctx.fillRect(-s * 0.04, 0.02 * s, s * 0.08, s * 0.1);
    } else if (id === 'gem') {
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.22);
      ctx.lineTo(s * 0.18, 0);
      ctx.lineTo(0, s * 0.22);
      ctx.lineTo(-s * 0.18, 0);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, -s * 0.1, s * 0.09, 0, TAU);
      ctx.fill();
      ctx.fillRect(-s * 0.04, -s * 0.02, s * 0.08, s * 0.24);
      ctx.fillRect(-s * 0.14, s * 0.04, s * 0.28, s * 0.06);
    }
    ctx.restore();
  }

  function drawHallDecor() {
    for (let i = 0; i < ROOM_DEFS.length; i++) {
      const d = ROOM_DEFS[i];
      const rec = G.rooms[i];
      const cx = sx(d.c + d.w * 0.5);
      const cy = sy(d.r + d.h * 0.5);
      if (!rec.taken) {
        const bob = Math.sin(G.clock * 3 + i) * cell * 0.06;
        drawTreasureIcon(cx, cy + bob, rec.loot.id, cell * 0.85, 0.95);
        ctx.fillStyle = rgba(GOLD, 0.18 + 0.12 * Math.sin(G.clock * 5 + i));
        ctx.beginPath();
        ctx.arc(cx, cy + bob, cell * 0.38, 0, TAU);
        ctx.fill();
      }
      ctx.font = '700 ' + Math.max(9, cell * 0.28) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = rec.taken ? 'rgba(255,200,140,0.35)' : rgba(WHT, 0.8);
      ctx.fillText(rec.name, cx, sy(d.r) + 3);
    }
  }

  function drawPlayerAt(x, y, ghost) {
    const px = sx(x);
    const py = sy(y);
    const s = cell;
    ctx.save();
    ctx.translate(px, py);
    ctx.globalAlpha = ghost ? 0.55 + 0.4 * Math.sin(G.clock * 18) : 1;
    const fx = DX[G.player.face];
    const fy = DY[G.player.face];
    ctx.fillStyle = rgba(GOLD, 0.32);
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.46, 0, TAU);
    ctx.fill();
    if (G.view === 'hall') {
      ctx.strokeStyle = rgba(CYN, 0.55 + 0.35 * Math.sin(G.clock * 5));
      ctx.lineWidth = Math.max(2, s * 0.08);
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.4, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, s * 0.04, s * 0.26, s * 0.29, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff6d0';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.1, s * 0.17, s * 0.15, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a0c08';
    ctx.beginPath();
    ctx.arc(-s * 0.06, -s * 0.12, s * 0.035, 0, TAU);
    ctx.arc(s * 0.06, -s * 0.12, s * 0.035, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#1a0c08';
    ctx.lineWidth = Math.max(1.2, s * 0.045);
    ctx.beginPath();
    ctx.arc(0, -s * 0.02, s * 0.08, 0.15, Math.PI - 0.15);
    ctx.stroke();
    ctx.strokeStyle = rgba(CYN, 1);
    ctx.lineWidth = Math.max(2, s * 0.08);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(fx * s * 0.16, fy * s * 0.16);
    ctx.lineTo(fx * s * 0.4, fy * s * 0.4);
    ctx.stroke();
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.beginPath();
    ctx.arc(fx * s * 0.42, fy * s * 0.42, s * 0.055, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawMobAt(e, x, y) {
    const px = sx(x);
    const py = sy(y);
    const s = cell;
    const k = KINDS[e.kind];
    const bob = Math.sin(e.walk) * s * 0.03;
    ctx.save();
    ctx.translate(px, py);
    if (e.hurtT > 0) ctx.globalAlpha = 0.55 + 0.45 * Math.sin(G.clock * 40);
    ctx.fillStyle = rgba(k.rgb, 0.95);
    if (e.kind === 'spy') {
      ctx.beginPath();
      ctx.arc(0, bob, s * 0.16, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(k.rgb, 0.8);
      ctx.lineWidth = Math.max(1.1, s * 0.05);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + e.walk * 0.2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * s * 0.12, Math.sin(a) * s * 0.12 + bob);
        ctx.lineTo(Math.cos(a) * s * 0.28, Math.sin(a) * s * 0.28 + bob);
        ctx.stroke();
      }
      ctx.fillStyle = '#1a0c08';
      ctx.beginPath();
      ctx.arc(-s * 0.05, -s * 0.04 + bob, s * 0.03, 0, TAU);
      ctx.arc(s * 0.05, -s * 0.04 + bob, s * 0.03, 0, TAU);
      ctx.fill();
    } else if (e.kind === 'snk') {
      ctx.beginPath();
      ctx.ellipse(0, bob, s * 0.28, s * 0.14, Math.sin(e.walk) * 0.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#082010';
      ctx.beginPath();
      ctx.arc(-s * 0.12, -s * 0.02 + bob, s * 0.035, 0, TAU);
      ctx.arc(-s * 0.02, -s * 0.02 + bob, s * 0.035, 0, TAU);
      ctx.fill();
    } else if (e.kind === 'two') {
      ctx.beginPath();
      ctx.arc(-s * 0.14, -s * 0.04 + bob, s * 0.16, 0, TAU);
      ctx.arc(s * 0.14, -s * 0.04 + bob, s * 0.16, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(k.rgb, 0.9);
      ctx.beginPath();
      ctx.ellipse(0, s * 0.12 + bob, s * 0.2, s * 0.16, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fff0f4';
      ctx.beginPath();
      ctx.arc(-s * 0.18, -s * 0.06 + bob, s * 0.04, 0, TAU);
      ctx.arc(-s * 0.08, -s * 0.06 + bob, s * 0.04, 0, TAU);
      ctx.arc(s * 0.08, -s * 0.06 + bob, s * 0.04, 0, TAU);
      ctx.arc(s * 0.18, -s * 0.06 + bob, s * 0.04, 0, TAU);
      ctx.fill();
    } else if (e.kind === 'skl') {
      ctx.beginPath();
      ctx.arc(0, -s * 0.06 + bob, s * 0.16, 0, TAU);
      ctx.fill();
      ctx.fillRect(-s * 0.07, s * 0.06 + bob, s * 0.14, s * 0.16);
      ctx.fillStyle = '#1a0c08';
      ctx.beginPath();
      ctx.arc(-s * 0.06, -s * 0.08 + bob, s * 0.04, 0, TAU);
      ctx.arc(s * 0.06, -s * 0.08 + bob, s * 0.04, 0, TAU);
      ctx.fill();
    } else if (e.kind === 'trl') {
      ctx.beginPath();
      ctx.ellipse(0, s * 0.04 + bob, s * 0.24, s * 0.26, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(k.rgb, 0.85);
      ctx.beginPath();
      ctx.arc(-s * 0.1, -s * 0.22 + bob, s * 0.07, 0, TAU);
      ctx.arc(s * 0.1, -s * 0.22 + bob, s * 0.07, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#102008';
      ctx.beginPath();
      ctx.arc(-s * 0.07, -s * 0.04 + bob, s * 0.04, 0, TAU);
      ctx.arc(s * 0.07, -s * 0.04 + bob, s * 0.04, 0, TAU);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(0, bob, s * 0.26, s * 0.16, 0.35, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(s * 0.18, -s * 0.08 + bob);
      ctx.lineTo(s * 0.3, -s * 0.22 + bob);
      ctx.lineTo(s * 0.08, -s * 0.1 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff0f0';
      ctx.beginPath();
      ctx.arc(s * 0.1, -s * 0.04 + bob, s * 0.04, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawHallMonAt(e, x, y) {
    const px = sx(x);
    const py = sy(y);
    const s = cell;
    const bob = Math.sin(e.walk * 1.4) * s * 0.04;
    const pulse = 0.7 + 0.3 * Math.sin(G.clock * 6);
    ctx.save();
    ctx.translate(px, py);
    ctx.fillStyle = rgba(MAG, 0.22 * pulse);
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.48, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.arc(0, bob, s * 0.22, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(MAG, 0.85);
    ctx.lineWidth = Math.max(1.4, s * 0.07);
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU + e.walk * 0.35;
      const len = s * (0.32 + 0.06 * Math.sin(G.clock * 8 + i));
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * s * 0.12, Math.sin(a) * s * 0.12 + bob);
      ctx.quadraticCurveTo(
        Math.cos(a + 0.4) * s * 0.22,
        Math.sin(a + 0.4) * s * 0.22 + bob,
        Math.cos(a) * len,
        Math.sin(a) * len + bob
      );
      ctx.stroke();
    }
    ctx.fillStyle = '#2a0814';
    ctx.beginPath();
    ctx.arc(-s * 0.07, -s * 0.04 + bob, s * 0.045, 0, TAU);
    ctx.arc(s * 0.07, -s * 0.04 + bob, s * 0.045, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawShotAt(s, x, y) {
    const px = sx(x);
    const py = sy(y);
    ctx.save();
    ctx.strokeStyle = rgba(CYN, 0.95);
    ctx.shadowColor = rgba(CYN, 0.8);
    ctx.shadowBlur = 10;
    ctx.lineWidth = Math.max(2.2, cell * 0.09);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(px - DX[s.d] * cell * 0.2, py - DY[s.d] * cell * 0.2);
    ctx.lineTo(px + DX[s.d] * cell * 0.14, py + DY[s.d] * cell * 0.14);
    ctx.stroke();
    ctx.restore();
  }

  function drawMinimap() {
    if (G.view !== 'room' || radarH < 8) return;
    const x = ox;
    const y = oy + G.rows * cell + Math.max(6, cell * 0.12);
    const w = G.cols * cell;
    const h = radarH;
    ctx.fillStyle = 'rgba(12, 8, 6, 0.92)';
    ctx.strokeStyle = 'rgba(255, 138, 42, 0.35)';
    ctx.lineWidth = 1;
    const rr = 8;
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    const mx = x + 10 * dpr;
    const my = y + 5 * dpr;
    const mw = w - 20 * dpr;
    const mh = h - 10 * dpr;
    const sc = Math.min(mw / HALL_C, mh / HALL_R);
    const rx = mx + (mw - HALL_C * sc) * 0.5;
    const ry = my + (mh - HALL_R * sc) * 0.5;
    for (let r = 0; r < HALL_R; r++) {
      for (let c = 0; c < HALL_C; c++) {
        const t = G.hallGrid[hallIdx(c, r)];
        if (t === WALL) ctx.fillStyle = 'rgba(255, 138, 42, 0.28)';
        else if (t === ROOMTILE) ctx.fillStyle = 'rgba(255, 180, 80, 0.12)';
        else if (t === DOOR) ctx.fillStyle = rgba(CYN, 0.55);
        else ctx.fillStyle = 'rgba(255, 200, 140, 0.08)';
        ctx.fillRect(rx + c * sc, ry + r * sc, sc + 0.4, sc + 0.4);
      }
    }
    if (G.roomI >= 0) {
      const d = ROOM_DEFS[G.roomI];
      ctx.strokeStyle = rgba(GOLD, 0.95);
      ctx.lineWidth = 1.4;
      ctx.strokeRect(rx + d.c * sc, ry + d.r * sc, d.w * sc, d.h * sc);
    }
    for (let i = 0; i < G.hallMons.length; i++) {
      const e = G.hallMons[i];
      ctx.fillStyle = rgba(MAG, 0.95);
      ctx.beginPath();
      ctx.arc(rx + e.x * sc, ry + e.y * sc, Math.max(1.6, 2 * dpr), 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = rgba(CYN, 1);
    ctx.beginPath();
    const def = ROOM_DEFS[G.roomI];
    ctx.arc(rx + (def.doorC + 0.5) * sc, ry + (def.doorR + 0.5) * sc, Math.max(1.8, 2.2 * dpr), 0, TAU);
    ctx.fill();
  }

  function draw() {
    if (!ctx) return;
    layout();
    ctx.fillStyle = '#0a0706';
    ctx.fillRect(0, 0, W, H);
    const sh = (G.shake > 0 && !REDUCE) ? (Math.random() - 0.5) * G.shake * 12 : 0;
    const sv = (G.shake > 0 && !REDUCE) ? (Math.random() - 0.5) * G.shake * 10 : 0;
    ctx.save();
    ctx.translate(sh, sv);
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      ctx.fillStyle = rgba(ORN, m.a * (0.6 + 0.4 * Math.sin(G.clock * 1.4 + m.p * 8)));
      ctx.beginPath();
      ctx.arc(m.x * W, m.y * H, m.r, 0, TAU);
      ctx.fill();
    }
    drawWalls();
    if (G.view === 'hall') drawHallDecor();
    for (let i = 0; i < rings.length; i++) {
      const rg = rings[i];
      const a = rg.t / rg.life;
      ctx.strokeStyle = rgba(rg.rgb, a * 0.8);
      ctx.lineWidth = Math.max(1.2, cell * 0.06);
      ctx.beginPath();
      ctx.arc(sx(rg.x), sy(rg.y), (0.3 + (1 - a) * 0.7) * cell, 0, TAU);
      ctx.stroke();
    }
    if (G.view === 'room' && G.treasure) {
      const bob = Math.sin(G.clock * 4.2) * cell * 0.08;
      ctx.fillStyle = rgba(GOLD, 0.16 + 0.1 * Math.sin(G.clock * 6));
      ctx.beginPath();
      ctx.arc(sx(G.treasure.x), sy(G.treasure.y) + bob, cell * 0.42, 0, TAU);
      ctx.fill();
      drawTreasureIcon(sx(G.treasure.x), sy(G.treasure.y) + bob, G.treasure.id, cell, 1);
    }
    if (G.view === 'hall') {
      for (let i = 0; i < G.hallMons.length; i++) {
        drawHallMonAt(G.hallMons[i], G.hallMons[i].x, G.hallMons[i].y);
      }
    } else {
      for (let i = 0; i < G.mobs.length; i++) {
        if (G.mobs[i].alive) drawMobAt(G.mobs[i], G.mobs[i].x, G.mobs[i].y);
      }
      if (G.intruder) drawHallMonAt(G.intruder, G.intruder.x, G.intruder.y);
    }
    if (G.pShot) drawShotAt(G.pShot, G.pShot.x, G.pShot.y);
    if (G.deadT <= 0 && (G.mode === 'play' || G.mode === 'title')) {
      drawPlayerAt(G.player.x, G.player.y, G.invuln > 0);
    }
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = q.t / q.life;
      ctx.fillStyle = rgba(q.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), Math.max(1, q.r * cell * (0.6 + a)), 0, TAU);
      ctx.fill();
    }
    ctx.font = '700 ' + Math.max(11, cell * 0.36) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < pops.length; i++) {
      const f = pops[i];
      ctx.fillStyle = rgba(f.rgb, f.t / f.life);
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
    if (G.flash > 0 && !REDUCE) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.2);
      ctx.fillRect(ox, oy, G.cols * cell, G.rows * cell);
    }
    drawMinimap();
    ctx.restore();
  }

  function overlayBlocksPlay() {
    return overlayOpen() && G.mode !== 'play';
  }

  function worldFromPtr(cx, cy) {
    const rect = canvas.getBoundingClientRect();
    const x = (cx - rect.left) * (W / Math.max(1, rect.width));
    const y = (cy - rect.top) * (H / Math.max(1, rect.height));
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
    if (hypot(dx, dy) > 0.32) {
      ptr.dragging = true;
      const d = snap4(dx, dy);
      ptr.dx = DX[d];
      ptr.dy = DY[d];
      G.wantKey = d;
    }
  }
  function onPointerUp(e) {
    if (ptr.id != null && e.pointerId !== ptr.id) return;
    if (ptr.down && !ptr.dragging && !overlayBlocksPlay()) firePlayer();
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
    if (down) {
      if (dir === 'up') G.wantKey = 0;
      if (dir === 'right') G.wantKey = 1;
      if (dir === 'down') G.wantKey = 2;
      if (dir === 'left') G.wantKey = 3;
    }
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startHunt();
      return;
    }
    if (G.mode === 'win' || G.mode === 'lose') restart();
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isUp = k === 'ArrowUp' || k === 'w' || k === 'W' || code === 'KeyW' || code === 'ArrowUp';
    const isDn = k === 'ArrowDown' || k === 's' || k === 'S' || code === 'KeyS' || code === 'ArrowDown';
    const isLf = k === 'ArrowLeft' || k === 'a' || k === 'A' || code === 'KeyA' || code === 'ArrowLeft';
    const isRt = k === 'ArrowRight' || k === 'd' || k === 'D' || code === 'KeyD' || code === 'ArrowRight';
    const isSp = k === ' ' || k === 'Spacebar' || code === 'Space';
    const onBtn = e.target && e.target.tagName === 'BUTTON';
    if ((isUp || isDn || isLf || isRt || isSp) && !onBtn) e.preventDefault();
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
      if (onBtn) return;
      audio.ensure();
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (isSp && !overlayBlocksPlay()) firePlayer();
    }
  }

  function bindPad(btn, dir) {
    if (!btn) return;
    const start = function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      if (dir === 'fire') {
        if (!overlayBlocksPlay()) firePlayer();
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
        r: rand(0.5, 1.5) * dpr,
        a: rand(0.03, 0.1),
        p: rand(0, 1)
      });
    }
  }

  function layout() {
    if (!canvas || !stageEl) return;
    const pad = 10 * dpr;
    radarH = G.view === 'room' ? Math.max(34 * dpr, Math.min(52 * dpr, H * 0.1)) : 0;
    cell = Math.max(12, Math.min((W - pad * 2) / G.cols, (H - pad * 2 - radarH) / G.rows));
    ox = (W - G.cols * cell) * 0.5;
    oy = (H - G.rows * cell - radarH) * 0.42;
  }

  function resize() {
    if (!canvas || !stageEl) return;
    const rect = stageEl.getBoundingClientRect();
    dpr = Math.min(2.25, window.devicePixelRatio || 1);
    W = Math.max(1, Math.floor(rect.width * dpr));
    H = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width = W;
    canvas.height = H;
    seedMotes();
    layout();
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

  if (btnHunt) btnHunt.addEventListener('click', function () { audio.ensure(); startHunt(); });
  if (btnChase) btnChase.addEventListener('click', function () { audio.ensure(); startChase(); });
  if (ovAgain) ovAgain.addEventListener('click', function () { primaryAction(); });
  if (ovMenu) ovMenu.addEventListener('click', function () { audio.ensure(); bootTitle(); });
  if (btnRetry) btnRetry.addEventListener('click', function () { restart(); });
  if (btnMute) btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  if (modeHunt) modeHunt.addEventListener('click', function () {
    audio.ensure();
    startHunt();
  });
  if (modeChase) modeChase.addEventListener('click', function () {
    audio.ensure();
    startChase();
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

  if (typeof window !== 'undefined') {
    window.__VENT = { keys: keys, G: G, wantFromKeys: wantFromKeys };
  }

  loadBest();
  resize();
  bootTitle();
  syncHud();

  if (padEl && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
    setHint('滑动走 · 点按或射开火 · 进房抢宝');
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
